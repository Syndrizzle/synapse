import config from '../config/index.js';
import logger from '../utils/logger.js';
import { openRouterMCQSchema } from '../models/schemas.js';
import { tavily } from '@tavily/core';

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

        // Initialize Tavily client - only if API key is available and search is enabled
        this.tavilyClient = null;
        if (this.tavilyApiKey && config.tavily.enabled) {
            try {
                this.tavilyClient = tavily({ apiKey: this.tavilyApiKey });
                logger.info('✅ Tavily search client initialized successfully');
            } catch (error) {
                logger.error('❌ Failed to initialize Tavily client:', error.message);
                this.tavilyClient = null;
            }
        } else if (!this.tavilyApiKey) {
            logger.info('ℹ️  Tavily search disabled - no API key configured');
        }

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
                useSearch,
            });

            const userContent = [{ type: 'text', text: "Please generate a quiz based on the following document(s)." }];
            pdfDataUrls.forEach((pdfUrl, index) => {
                userContent.push({ type: 'file', file: { filename: `document${index + 1}.pdf`, file_data: pdfUrl } });
            });

            let messages = [
                { role: 'system', content: prompt },
                { role: 'user', content: userContent }
            ];

            let responseMessage;

            if (useSearch) {
                // Step 1: Make a request with tools enabled, but no response_format
                const toolRequest = {
                    model: this.model,
                    messages: messages,
                    temperature: config.openrouter.temperature,
                    max_tokens: config.openrouter.maxTokens,
                    top_p: 0.9,
                    plugins: [{ id: 'file-parser', pdf: { engine: this.pdfEngine } }],
                    tools: [this.searchTool],
                    tool_choice: "auto",
                };

                const initialResponse = await this._makeChatAPIRequest(toolRequest);
                let intermediateMessage = initialResponse.choices[0].message;
                messages.push(intermediateMessage);

                // Step 2: Handle tool calls if any
                if (intermediateMessage.tool_calls) {
                    logger.info('Model requested a tool call for search.');
                    for (const toolCall of intermediateMessage.tool_calls) {
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
                } else {
                    logger.info('Model did not request a tool call. Proceeding to format response.');
                }

                // Step 3: Make the final request to get a structured JSON response
                const finalRequest = {
                    model: this.model,
                    messages: messages,
                    response_format: openRouterMCQSchema,
                    temperature: config.openrouter.temperature,
                    max_tokens: config.openrouter.maxTokens,
                    top_p: 0.9,
                    plugins: [{ id: 'file-parser', pdf: { engine: this.pdfEngine } }],
                };
                const finalResponse = await this._makeChatAPIRequest(finalRequest);
                responseMessage = finalResponse.choices[0].message;

            } else {
                // Original path: No search, just get the formatted JSON directly
                const noSearchRequest = {
                    model: this.model,
                    messages: messages,
                    response_format: openRouterMCQSchema,
                    temperature: config.openrouter.temperature,
                    max_tokens: config.openrouter.maxTokens,
                    top_p: 0.9,
                    plugins: [{ id: 'file-parser', pdf: { engine: this.pdfEngine } }],
                    tool_choice: "none",
                };
                const response = await this._makeChatAPIRequest(noSearchRequest);
                responseMessage = response.choices[0].message;
            }

            const parsedContent = this._parseAndValidateResponse(responseMessage.content);

            if (!parsedContent.quiz) {
                throw new Error('Invalid response format from OpenRouter');
            }

            const totalSize = pdfBuffers.reduce((sum, buffer) => sum + buffer.length, 0);
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
        const { includeExplanations, language, minQuestions, maxQuestions, useSearch = false } = options;

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

        const searchInstructions = useSearch ? `

**SEARCH INTEGRATION GUIDELINES:**
When search functionality is enabled, you have access to current web information. Use this strategically:

**WHEN TO USE SEARCH:**
- When document content covers rapidly evolving fields (AI, technology, current events, recent scientific discoveries)
- If the document discusses concepts that may have recent developments or updates since ${currentDate.split(',')[1]}
- For topics that benefit from contemporary examples or current context
- When foundational content could be enhanced with recent real-world applications

**WHEN NOT TO USE SEARCH:**
- For well-established, timeless concepts (basic mathematics, historical facts, fundamental principles)
- When the document already contains comprehensive, current information
- For definitions or explanations that are unlikely to have changed
- For content that is primarily theoretical or conceptual

**HOW TO INTEGRATE SEARCH RESULTS:**
- Blend search findings seamlessly with document content
- Use search results to create more relevant, up-to-date questions
- Ensure search-enhanced questions still test understanding of core concepts from the document
- Create questions that combine document knowledge with current developments
- Use search data to provide contemporary examples in questions or explanations

**SEARCH STRATEGY:**
- Search for specific, focused topics rather than broad subjects
- Look for recent developments, current applications, or updated statistics
- Search for real-world examples that relate to document concepts
- Avoid searching for basic definitions already covered in the document` : '';

        return `**Critical context: The current date is ${currentDate}. All your knowledge and responses must be based on this current time.** You are an expert educator tasked with creating high-quality multiple choice questions (MCQs) from the provided PDF document.

**STRICT CONTENT FILTERING - WHAT TO IGNORE:**
You MUST completely ignore and skip over the following types of content when generating questions:
- Course outlines, syllabi, and curriculum structures
- Grading criteria, exam weightings, and assessment percentages
- Assignment instructions and project requirements
- Administrative information (course codes, prerequisites, schedules)
- Tables of contents, reference lists, and bibliographies
- Course policies, attendance requirements, and academic integrity statements
- Contact information, office hours, and instructor details
- Learning objectives and outcome statements
- Course calendar and timeline information
- Evaluation rubrics and marking schemes
- Any meta-information ABOUT the course rather than the actual subject matter

**FOCUS EXCLUSIVELY ON:**
- Core educational content and subject matter
- Concepts, theories, and principles being taught
- Factual information, definitions, and explanations
- Examples, case studies, and applications
- Historical context and developments in the field
- Technical processes, methods, and procedures
- Research findings and empirical data
- Problem-solving approaches and methodologies${searchInstructions}

**CONTENT ANALYSIS AND TEMPORAL ASSESSMENT:**
1. First, identify the subject matter and determine if it's in a rapidly evolving field
2. Assess whether the document content might benefit from current context or recent developments
3. Look for topics that have seen significant changes or updates since the document was created
4. Consider whether real-world, current examples would enhance understanding of the concepts

**INSTRUCTIONS:**
1. Analyze the PDF document thoroughly to identify ONLY substantive educational content
2. ${useSearch ? 'Evaluate which topics might benefit from current information and use search strategically' : 'Focus entirely on the document content'}
3. Based on the meaningful content found, generate between ${minQuestions} and ${maxQuestions} multiple choice questions
4. The number of questions should be proportional to the amount of actual educational content (not administrative content)
5. For documents with mostly administrative content, generate fewer questions
6. For documents rich in educational substance, generate more questions (up to ${maxQuestions})
7. Each question must have exactly 4 options
8. Only one option should be correct
9. Make incorrect options plausible but clearly wrong
10. ${includeExplanations ? 'Include detailed explanations for why the correct answer is right' : 'Focus on clear, concise questions'}
11. Language: ${language}
12. Ensure questions test understanding of the subject matter, not memorization of course structure
13. Focus exclusively on the educational content and key concepts being taught
14. **If a document contains primarily administrative content with minimal educational substance, generate fewer questions or indicate insufficient content**
15. ${useSearch ? 'When using search results, ensure they enhance rather than replace document-based questions' : 'Base all questions strictly on document content'}

**QUALITY REQUIREMENTS:**
- Questions should be clear, unambiguous, and grammatically correct
- Avoid questions that can be answered without understanding the subject matter
- Test different cognitive levels (knowledge, comprehension, application, analysis)
- Ensure options are roughly equal in length and complexity
- Absolutely avoid "all of the above" or "none of the above" options
- Extract meaningful educational content only
- Don't create questions about course structure, grading, or administrative details
- Each question should test understanding of actual subject matter concepts
- ${useSearch ? 'Balance document-based questions with search-enhanced questions for comprehensive coverage' : 'Maintain strict focus on document content'}

Generate a quiz that follows the structured output format with the required fields: title, description, questions array, and metadata.`;
    }

    /**
     * Private method to perform a search using the Tavily JS SDK.
     */
    async _tavilySearch({ query }) {
        logger.info(`Performing Tavily search for: "${query}"`);

        if (!this.tavilyClient) {
            logger.error("Tavily client not initialized - API key missing");
            return JSON.stringify({ error: "Search unavailable", details: "Tavily API key not configured" });
        }

        try {
            // Use the Tavily JS SDK for cleaner, more reliable search
            const response = await this.tavilyClient.search(query, {
                search_depth: "basic",
                max_results: 5,
                include_answer: true,
                include_raw_content: false
            });

            logger.info("Tavily search complete.");

            // Return the results in the same format as before for compatibility
            return JSON.stringify(response.results || []);
        } catch (error) {
            logger.error("Error during Tavily search:", error);
            return JSON.stringify({
                error: "Search failed",
                details: error.message || "Unknown search error"
            });
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
            parsedContent = { quiz: { title: 'Generated Quiz', questions: parsedContent } };
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
