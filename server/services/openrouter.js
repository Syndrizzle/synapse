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
        this.tavilyApiKey = config.tavily.apiKey;
        this.baseUrl = config.openrouter.baseUrl;
        this.model = config.openrouter.model;
        this.timeout = config.openrouter.timeout;
        this.maxRetries = config.openrouter.maxRetries;
        this.pdfEngine = config.openrouter.pdfProcessingEngine;

        this.searchTool = {
            type: "function",
            function: {
                name: "tavily_search",
                description: "Get information on recent events from the web to create more relevant and up-to-date quiz questions. Use this for topics that are contemporary or evolving.",
                parameters: {
                    type: "object",
                    properties: {
                        query: {
                            type: "string",
                            description: "The search query to use. For example: 'Latest advancements in AI'"
                        },
                    },
                    required: ["query"]
                }
            }
        };

        this.toolMapping = {
            "tavily_search": this._tavilySearch.bind(this)
        };
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
            useSearch = false,
        } = options;

        try {
            const pdfBuffers = Array.isArray(pdfBuffer) ? pdfBuffer : [pdfBuffer];
            logger.info(`Generating MCQs from ${pdfBuffers.length} PDF(s) using ${this.model}. Search: ${useSearch ? 'Enabled' : 'Disabled'}`);

            const pdfDataUrls = pdfBuffers.map(buffer => `data:application/pdf;base64,${buffer.toString('base64')}`);

            const prompt = this.createPrompt({
                includeExplanations,
                language,
                minQuestions,
                maxQuestions,
                pdfCount: pdfBuffers.length,
            });

            const userContent = [{ type: 'text', text: "Please generate a quiz based on the following document(s)." }];
            pdfDataUrls.forEach((pdfUrl, index) => {
                userContent.push({ type: 'file', file: { filename: `document${index + 1}.pdf`, file_data: pdfUrl } });
            });

            let messages = [
                { role: 'system', content: prompt },
                { role: 'user', content: userContent }
            ];

            const requestBody = {
                model: this.model,
                messages: messages,
                response_format: openRouterMCQSchema,
                temperature: config.openrouter.temperature,
                max_tokens: config.openrouter.maxTokens,
                top_p: 0.9,
                plugins: [{ id: 'file-parser', pdf: { engine: this.pdfEngine } }],
                tools: useSearch ? [this.searchTool] : undefined,
                tool_choice: useSearch ? "auto" : "none",
            };

            const initialResponse = await this._makeChatAPIRequest(requestBody);
            
            let responseMessage = initialResponse.choices[0].message;
            messages.push(responseMessage);

            if (useSearch && responseMessage.tool_calls) {
                logger.info('Model requested a tool call for search.');
                for (const toolCall of responseMessage.tool_calls) {
                    const functionName = toolCall.function.name;
                    if (this.toolMapping[functionName]) {
                        const functionArgs = JSON.parse(toolCall.function.arguments);
                        const functionResponse = await this.toolMapping[functionName](functionArgs);
                        messages.push({
                            tool_call_id: toolCall.id,
                            role: "tool",
                            name: functionName,
                            content: functionResponse,
                        });
                    }
                }

                logger.info('Sending tool response back to the model to generate final quiz.');
                const finalRequestBody = { ...requestBody, messages: messages, tools: undefined, tool_choice: undefined };
                const finalResponse = await this._makeChatAPIRequest(finalRequestBody);
                responseMessage = finalResponse.choices[0].message;
            }
            
            const parsedContent = this._parseAndValidateResponse(responseMessage.content);

            if (!parsedContent.quiz) {
                throw new Error('Invalid response format from OpenRouter');
            }

            // Calculate total size of all PDFs
            const totalSize = pdfBuffers.reduce((sum, buffer) => sum + buffer.length, 0);

            // Validate and enhance the quiz
            const quiz = this.validateAndEnhanceQuiz(parsedContent.quiz, totalSize, pdfBuffers.length);

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

        // Get current date and time in Indian Standard Time (IST)
        const now = new Date();
        const dateTimeOptions = {
            timeZone: 'Asia/Kolkata',
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            timeZoneName: 'short'
        };
        const formatter = new Intl.DateTimeFormat('en-IN', dateTimeOptions);
        const currentDate = formatter.format(now);

        return `**Critical context: The current date is ${currentDate}. All your knowledge and responses must be based on this current time.** You are an expert educator tasked with creating high-quality multiple choice questions (MCQs) from the provided PDF document.

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
13. **Crucially, ignore non-content sections like tables of contents, course outlines, and reference lists when creating questions.**

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
     * Private method to perform a search using the Tavily API.
     */
    async _tavilySearch({ query }) {
        logger.info(`Performing Tavily search for: "${query}"`);
        try {
            const response = await fetch('https://api.tavily.com/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.tavilyApiKey}` },
                body: JSON.stringify({ api_key: this.tavilyApiKey, query, search_depth: "advanced", max_results: 5, include_answer: true })
            });
            if (!response.ok) {
                const errorBody = await response.text();
                logger.error(`Tavily API error: ${response.status} ${response.statusText}`, errorBody);
                throw new Error(`Tavily search failed: ${response.status}`);
            }
            const data = await response.json();
            logger.info("Tavily search complete.");
            return JSON.stringify(data.results);
        } catch (error) {
            logger.error("Error during Tavily search:", error);
            return JSON.stringify({ error: "Search failed", details: error.message });
        }
    }

    /**
     * Makes a generic chat API request to OpenRouter.
     */
    async _makeChatAPIRequest(requestBody, retryCount = 0) {
        if (config.development.debugMode) {
            // Clone the request body to avoid logging sensitive file data
            const loggableBody = JSON.parse(JSON.stringify(requestBody));
            if (loggableBody.messages) {
                loggableBody.messages.forEach(msg => {
                    if (Array.isArray(msg.content)) {
                        msg.content = msg.content.map(part => {
                            if (part.type === 'file' && part.file?.file_data) {
                                return { ...part, file: { ...part.file, file_data: '[REDACTED_FOR_LOGS]' } };
                            }
                            return part;
                        });
                    }
                });
            }
            logger.debug('OpenRouter API Request:', loggableBody);
        }

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);
            const response = await fetch(`${this.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
                signal: controller.signal,
            });
            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
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

            const responseData = await response.json();
            if (config.development.debugMode) {
                logger.debug('Full OpenRouter API response:', responseData);
            }
            return responseData;
        } catch (error) {
            if (error.name === 'AbortError') throw new Error(`OpenRouter API request timed out after ${this.timeout}ms`);
            if (retryCount < this.maxRetries && this.shouldRetry(error)) {
                logger.warn(`OpenRouter request failed, retrying (${retryCount + 1}/${this.maxRetries}):`, error.message);
                await this.delay(Math.pow(2, retryCount) * 1000);
                return this._makeChatAPIRequest(requestBody, retryCount + 1);
            }
            throw error;
        }
    }

    /**
     * Parses and validates the JSON response from the model.
     */
    _parseAndValidateResponse(responseContent) {
        let parsedContent;
        try {
            parsedContent = JSON.parse(responseContent);
        } catch (parseError) {
            logger.error('Failed to parse OpenRouter response as JSON', { content: responseContent.substring(0, 500) });
            const jsonMatch = responseContent.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
            if (jsonMatch) {
                try {
                    parsedContent = JSON.parse(jsonMatch[1]);
                    logger.info('Extracted JSON from markdown block');
                } catch (extractError) {
                    throw new Error('Could not parse JSON from response content');
                }
            } else {
                throw new Error('No valid JSON found in OpenRouter response');
            }
        }

        if (!parsedContent || typeof parsedContent !== 'object') {
            throw new Error('OpenRouter response is not a valid object');
        }

        if (!parsedContent.quiz && parsedContent.questions) {
             parsedContent = { quiz: parsedContent };
        } else if (!parsedContent.quiz && Array.isArray(parsedContent)) {
            parsedContent = { quiz: { title: 'Generated Quiz', questions: parsedContent }};
        }
        
        return parsedContent;
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
            tavilySearch: !!this.tavilyApiKey,
        };
    }
}

// Create and export singleton instance
const openRouterService = new OpenRouterService();

export default openRouterService;
export { OpenRouterService };
