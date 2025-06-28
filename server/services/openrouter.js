import config from '../config/index.js';
import logger from '../utils/logger.js';
import { openRouterMCQSchema } from '../models/schemas.js';

/**
 * OpenRouter AI service for MCQ generation
 * Handles all interactions with OpenRouter API using native PDF processing
 */

class OpenRouterService {
    constructor() {
        this.apiKey = config.openrouter.apiKey;
        this.baseUrl = config.openrouter.baseUrl;
        this.model = config.openrouter.model;
        this.timeout = config.openrouter.timeout;
        this.maxRetries = config.openrouter.maxRetries;
        this.pdfEngine = config.openrouter.pdfProcessingEngine;
    }

    /**
     * Generate MCQs from PDF file(s) using OpenRouter's native PDF processing
     * @param {Buffer|Buffer[]} pdfBuffer - PDF file buffer or array of buffers
     * @param {Object} options - Generation options
     * @returns {Object} Generated quiz data
     */
    async generateMCQsFromPDF(pdfBuffer, options = {}) {
        const {
            includeExplanations = true,
            language = 'en',
            minQuestions = config.quiz.minQuestions,
            maxQuestions = config.quiz.maxQuestions,
        } = options;

        try {
            // Handle single or multiple PDFs
            const pdfBuffers = Array.isArray(pdfBuffer) ? pdfBuffer : [pdfBuffer];
            logger.info(`Generating MCQs from ${pdfBuffers.length} PDF(s) using ${this.model}...`);
            logger.info(`Using PDF engine: ${this.pdfEngine}`);

            // Convert all PDF buffers to base64 data URLs
            const pdfDataUrls = pdfBuffers.map(buffer => {
                const base64PDF = buffer.toString('base64');
                return `data:application/pdf;base64,${base64PDF}`;
            });

            const prompt = this.createPrompt({
                includeExplanations,
                language,
                minQuestions,
                maxQuestions,
                pdfCount: pdfBuffers.length,
            });

            const response = await this.makeAPIRequestWithPDF(prompt, pdfDataUrls);

            if (!response.quiz) {
                throw new Error('Invalid response format from OpenRouter');
            }

            // Calculate total size of all PDFs
            const totalSize = pdfBuffers.reduce((sum, buffer) => sum + buffer.length, 0);

            // Validate and enhance the quiz
            const quiz = this.validateAndEnhanceQuiz(response.quiz, totalSize, pdfBuffers.length);

            logger.info(`Successfully generated ${quiz.questions.length} MCQs from ${pdfBuffers.length} PDF(s)`);
            return quiz;

        } catch (error) {
            logger.error('MCQ generation failed:', { message: error.message, stack: error.stack });
            throw new Error(`MCQ generation failed: ${error.message}`);
        }
    }

    /**
     * Create optimized prompt for MCQ generation from PDF
     */
    createPrompt(options) {
        const { includeExplanations, language, minQuestions, maxQuestions } = options;

        return `You are an expert educator tasked with creating high-quality multiple choice questions (MCQs) from the provided PDF document.

**INSTRUCTIONS:**
1. Analyze the PDF document thoroughly to understand its content and scope
2. Based on the document content, generate between ${minQuestions} and ${maxQuestions} multiple choice questions
3. The number of questions should be proportional to the amount of meaningful content in the PDF
4. For shorter documents or limited content, generate fewer questions (closer to ${minQuestions})
5. For comprehensive documents with rich content, generate more questions (up to ${maxQuestions})
6. Each question must have exactly 4 options
7. Only one option should be correct
8. Make incorrect options plausible but clearly wrong
9. ${includeExplanations ? 'Include detailed explanations for why the correct answer is right' : 'Focus on clear, concise questions'}
10. Language: ${language}
11. Ensure questions test understanding, not just memorization
12. Focus on the main topics and key concepts from the document

**QUALITY REQUIREMENTS:**
- Questions should be clear, unambiguous, and grammatically correct
- Avoid questions that can be answered without reading the document
- Test different cognitive levels (knowledge, comprehension, application, analysis)
- Ensure options are roughly equal in length and complexity
- Absolutely avoid "all of the above" or "none of the above" options
- Extract meaningful content from all sections of the document
- Don't create questions if there isn't enough substantial content
- Identify clear topics for each question based on the content

Generate a quiz that follows the structured output format with the required fields: title, description, questions array, and metadata.`;
    }

    /**
     * Make API request to OpenRouter with PDF(s) and plugin configuration
     */
    async makeAPIRequestWithPDF(prompt, pdfDataUrls, retryCount = 0) {
        try {
            // Handle single or multiple PDFs
            const pdfUrls = Array.isArray(pdfDataUrls) ? pdfDataUrls : [pdfDataUrls];

            // Standard message structure for PDFs
            const content = [];

            // Add text prompt first (recommended by OpenRouter)
            content.push({
                type: 'text',
                text: prompt,
            });

            // Add each PDF as a separate content item
            pdfUrls.forEach((pdfUrl, index) => {
                content.push({
                    type: 'file',
                    file: {
                        filename: `document${index + 1}.pdf`,
                        file_data: pdfUrl,
                    },
                });
            });

            const messages = [{
                role: 'user',
                content: content,
            }];

            const requestBody = {
                model: this.model,
                messages: messages,
                response_format: openRouterMCQSchema,
                temperature: config.openrouter.temperature,
                max_tokens: config.openrouter.maxTokens,
                top_p: 0.9,
                // Configure PDF processing plugin
                plugins: [
                    {
                        id: 'file-parser',
                        pdf: {
                            engine: this.pdfEngine,
                        },
                    },
                ],
            };

            if (config.development.debugMode) {
                logger.debug('OpenRouter PDF request:', {
                    model: this.model,
                    promptLength: prompt.length,
                    pdfCount: pdfUrls.length,
                    pdfEngine: this.pdfEngine,
                    temperature: requestBody.temperature,
                });
            }

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);

            const response = await fetch(`${this.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));

                // Log error response in development mode
                if (config.development.debugMode) {
                    logger.error('OpenRouter API error response:', {
                        status: response.status,
                        statusText: response.statusText,
                        headers: Object.fromEntries(response.headers.entries()),
                        errorData: errorData
                    });
                }

                throw new Error(`OpenRouter API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
            }

            const data = await response.json();

            if (config.development.debugMode) {
                logger.debug('Full OpenRouter API response:', data);
            }

            if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                logger.error('Invalid response structure from OpenRouter API. Full response:', JSON.stringify(data, null, 2));
                throw new Error('Invalid response structure from OpenRouter API');
            }

            // Parse the JSON response
            const responseContent = data.choices[0].message.content;
            let parsedContent;

            if (config.development.debugMode) {
                logger.debug(`Raw OpenRouter response: ${responseContent}`);
            }

            try {
                parsedContent = JSON.parse(responseContent);
            } catch (parseError) {
                logger.error('Failed to parse OpenRouter response as JSON');
                logger.error(`Raw content (first 1000 chars): ${responseContent.substring(0, 1000)}`);

                // Try to extract JSON from markdown code blocks
                const jsonMatch = responseContent.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
                if (jsonMatch) {
                    try {
                        parsedContent = JSON.parse(jsonMatch[1]);
                        logger.info('Extracted JSON from markdown block');
                    } catch (extractError) {
                        throw new Error('Could not parse JSON from response content');
                    }
                } else {
                    // Try to find JSON object in the response
                    const jsonObjectMatch = responseContent.match(/\{[\s\S]*\}/);
                    if (jsonObjectMatch) {
                        try {
                            parsedContent = JSON.parse(jsonObjectMatch[0]);
                            logger.info('Extracted JSON object from response');
                        } catch (extractError) {
                            throw new Error('Found JSON-like content but could not parse it');
                        }
                    } else {
                        throw new Error('No valid JSON found in OpenRouter response');
                    }
                }
            }

            // Validate the response structure
            if (!parsedContent || typeof parsedContent !== 'object') {
                throw new Error('OpenRouter response is not a valid object');
            }

            // Check if it has the expected quiz structure
            if (!parsedContent.quiz && !parsedContent.questions) {
                // If the response doesn't have the expected structure, try to wrap it
                if (Array.isArray(parsedContent)) {
                    parsedContent = {
                        quiz: {
                            title: 'Generated Quiz',
                            questions: parsedContent
                        }
                    };
                } else if (parsedContent.questions) {
                    parsedContent = {
                        quiz: parsedContent
                    };
                }
            }

            return parsedContent;

        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error(`OpenRouter API request timed out after ${this.timeout}ms`);
            }

            // Retry logic
            if (retryCount < this.maxRetries && this.shouldRetry(error)) {
                logger.warn(`OpenRouter request failed, retrying (${retryCount + 1}/${this.maxRetries}):`, error.message);
                await this.delay(Math.pow(2, retryCount) * 1000); // Exponential backoff
                return this.makeAPIRequestWithPDF(prompt, pdfDataUrls, retryCount + 1);
            }

            throw error;
        }
    }


    /**
     * Validate and enhance the generated quiz
     */
    validateAndEnhanceQuiz(quiz, pdfSize, pdfCount) {
        // Add metadata if missing
        if (!quiz.metadata) {
            quiz.metadata = {};
        }

        // Enhance metadata
        quiz.metadata.totalQuestions = quiz.questions.length;
        quiz.metadata.pdfSize = pdfSize;
        quiz.metadata.pdfCount = pdfCount;
        quiz.metadata.generatedAt = new Date().toISOString();
        quiz.metadata.model = this.model;
        quiz.metadata.pdfProcessingEngine = this.pdfEngine;

        // Update the estimated duration from the metadata
        if (!quiz.metadata.estimatedDuration) {
            quiz.metadata.estimatedDuration = Math.max(5, quiz.questions.length + 2);
        }

        // Add unique IDs to questions if missing
        quiz.questions.forEach((question, index) => {
            if (!question.id) {
                question.id = `q${index + 1}`;
            }

            // Ensure correctAnswer is a number
            if (typeof question.correctAnswer === 'string') {
                question.correctAnswer = parseInt(question.correctAnswer, 10);
            }

            // Validate correctAnswer is within range
            if (question.correctAnswer < 0 || question.correctAnswer > 3) {
                logger.warn(`Invalid correctAnswer for question ${question.id}, defaulting to 0`);
                question.correctAnswer = 0;
            }
        });

        return quiz;
    }

    /**
     * Check if error should trigger a retry
     */
    shouldRetry(error) {
        // Retry on network errors, timeouts, and 5xx server errors
        return error.message.includes('timeout') ||
            error.message.includes('network') ||
            error.message.includes('500') ||
            error.message.includes('502') ||
            error.message.includes('503') ||
            error.message.includes('504');
    }

    /**
     * Delay utility for exponential backoff
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Test OpenRouter connection
     */
    async testConnection() {
        try {
            const testPrompt = 'Generate a simple test question about mathematics with 4 multiple choice options.';

            const requestBody = {
                model: this.model,
                messages: [
                    {
                        role: 'user',
                        content: testPrompt,
                    },
                ],
                temperature: config.openrouter.temperature,
                max_tokens: 500,
            };

            const response = await fetch(`${this.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            if (response.ok) {
                return {
                    success: true,
                    model: this.model,
                    response: 'Connection successful',
                };
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            return {
                success: false,
                model: this.model,
                error: error.message,
            };
        }
    }

    /**
     * Get service status
     */
    getStatus() {
        return {
            configured: !!this.apiKey,
            model: this.model,
            baseUrl: this.baseUrl,
            timeout: this.timeout,
            maxRetries: this.maxRetries,
            pdfProcessing: 'native-openrouter',
            pdfEngine: this.pdfEngine,
        };
    }
}

// Create and export singleton instance
const openRouterService = new OpenRouterService();

export default openRouterService;
export { OpenRouterService };
