import Joi from 'joi';

/**
 * Data schemas and validation for Synapse Server
 * Uses Joi for runtime validation and JSON Schema for OpenRouter structured outputs
 */

// =================================================================
// JOI VALIDATION SCHEMAS (for runtime validation)
// =================================================================

/**
 * Quiz Question Schema for Joi validation
 */
export const quizQuestionSchema = Joi.object({
    id: Joi.string().required().description('Unique question identifier'),
    question: Joi.string().min(10).max(1000).required().description('The question text'),
    options: Joi.array().items(
        Joi.string().min(1).max(500)
    ).length(4).required().description('Array of exactly 4 answer options'),
    correctAnswer: Joi.number().integer().min(0).max(3).required().description('Index of correct answer (0-3)'),
    explanation: Joi.string().max(1000).optional().description('Optional explanation for the answer'),
    topic: Joi.string().max(200).optional().description('Topic or subject area'),
});

/**
 * Quiz Schema for Joi validation
 */
export const quizSchema = Joi.object({
    id: Joi.string().required().description('Unique quiz identifier'),
    title: Joi.string().min(5).max(200).required().description('Quiz title'),
    description: Joi.string().max(1000).optional().description('Quiz description'),
    questions: Joi.array().items(quizQuestionSchema).min(1).max(100).required(),
    createdAt: Joi.date().optional(),
    updatedAt: Joi.date().optional(),
    metadata: Joi.object({
        sourceFiles: Joi.array().items(Joi.string()).optional(),
        totalQuestions: Joi.number().integer().min(1).optional(),
        estimatedDuration: Joi.number().integer().min(1).optional(), // minutes
    }).optional(),
});

/**
 * File Upload Schema for Joi validation
 */
export const fileUploadSchema = Joi.object({
    originalname: Joi.string().required(),
    mimetype: Joi.string().valid('application/pdf').required(),
    size: Joi.number().integer().max(52428800).required(), // 50MB max
    buffer: Joi.binary().required(),
});

/**
 * Quiz Generation Request Schema
 */
export const quizGenerationRequestSchema = Joi.object({
    files: Joi.array().items(fileUploadSchema).min(1).max(5).required(),
    options: Joi.object({
        questionCount: Joi.number().integer().min(5).max(50).default(15),
        includeExplanations: Joi.boolean().default(true),
        topics: Joi.array().items(Joi.string().max(100)).max(10).optional(),
        language: Joi.string().valid('en', 'es', 'fr', 'de', 'it', 'pt').default('en'),
    }).optional().default({}),
});

// =================================================================
// JSON SCHEMA FOR OPENROUTER STRUCTURED OUTPUT
// =================================================================

/**
 * OpenRouter Structured Output Schema for MCQ Generation
 * This ensures the AI returns properly formatted MCQ data
 */
export const openRouterMCQSchema = {
    type: 'json_schema',
    json_schema: {
        name: 'mcq_quiz_generation',
        strict: true,
        schema: {
            type: 'object',
            properties: {
                quiz: {
                    type: 'object',
                    properties: {
                        title: {
                            type: 'string',
                            description: 'A descriptive title for the quiz based on the PDF content'
                        },
                        description: {
                            type: 'string',
                            description: 'A brief description of what the quiz covers'
                        },
                        questions: {
                            type: 'array',
                            description: 'Array of multiple choice questions',
                            items: {
                                type: 'object',
                                properties: {
                                    id: {
                                        type: 'string',
                                        description: 'Unique identifier for the question (e.g., q1, q2, etc.)'
                                    },
                                    question: {
                                        type: 'string',
                                        description: 'The question text, clear and concise'
                                    },
                                    options: {
                                        type: 'array',
                                        description: 'Exactly 4 answer options',
                                        items: {
                                            type: 'string'
                                        },
                                        minItems: 4,
                                        maxItems: 4
                                    },
                                    correctAnswer: {
                                        type: 'integer',
                                        description: 'Index of the correct answer (0, 1, 2, or 3)',
                                        minimum: 0,
                                        maximum: 3
                                    },
                                    explanation: {
                                        type: 'string',
                                        description: 'Brief explanation of why this answer is correct'
                                    },
                                    topic: {
                                        type: 'string',
                                        description: 'Topic or subject area this question covers'
                                    }
                                },
                                required: ['id', 'question', 'options', 'correctAnswer', 'explanation', 'topic'],
                                additionalProperties: false
                            }
                        },
                        metadata: {
                            type: 'object',
                            properties: {
                                totalQuestions: {
                                    type: 'integer',
                                    description: 'Total number of questions in the quiz',
                                    minimum: 1
                                },
                                estimatedDuration: {
                                    type: 'integer',
                                    description: 'Estimated time to complete in minutes',
                                    minimum: 1
                                },
                                topics: {
                                    type: 'array',
                                    description: 'Main topics covered in the quiz',
                                    items: {
                                        type: 'string'
                                    }
                                }
                            },
                            required: ['totalQuestions', 'estimatedDuration', 'topics'],
                            additionalProperties: false
                        }
                    },
                    required: ['title', 'description', 'questions', 'metadata'],
                    additionalProperties: false
                }
            },
            required: ['quiz'],
            additionalProperties: false
        }
    }
};

// =================================================================
// REDIS KEY PATTERNS
// =================================================================

/**
 * Redis key patterns for consistent data storage
 */
export const REDIS_KEYS = {
    // Quiz storage
    QUIZ: (quizId) => `quiz:${quizId}`,
    QUIZ_QUESTIONS: (quizId) => `quiz:${quizId}:questions`,
    QUIZ_ANSWERS: (quizId) => `quiz:${quizId}:answers`,
    QUIZ_PROCESSING: (quizId) => `quiz:${quizId}:processing`,
    QUIZ_RESULTS: (quizId) => `quiz:${quizId}:results`,
    
    // Rate limiting
    RATE_LIMIT: (type, identifier) => `rate:${type}:${identifier}`,
    
    // File processing cache
    FILE_CACHE: (fileHash) => `file:${fileHash}`,
    
    // OpenRouter response cache (for development)
    OPENROUTER_CACHE: (requestHash) => `openrouter:${requestHash}`,
};

// =================================================================
// CONSTANTS
// =================================================================

export const QUIZ_STATUS = {
    ACTIVE: 'active',
    COMPLETED: 'completed',
    ABANDONED: 'abandoned',
    EXPIRED: 'expired',
};

export const DIFFICULTY_LEVELS = {
    EASY: 'easy',
    MEDIUM: 'medium',
    HARD: 'hard',
    MIXED: 'mixed',
};

export const SUPPORTED_LANGUAGES = {
    EN: 'en',
    ES: 'es',
    FR: 'fr',
    DE: 'de',
    IT: 'it',
    PT: 'pt',
};

export const FILE_TYPES = {
    PDF: 'application/pdf',
};


// =================================================================
// HELPER FUNCTIONS
// =================================================================

/**
 * Validates data against a Joi schema
 * @param {Object} data - Data to validate
 * @param {Object} schema - Joi schema
 * @returns {Object} - { error, value }
 */
export const validate = (data, schema) => {
    return schema.validate(data, { 
        abortEarly: false,
        stripUnknown: true,
        convert: true,
    });
};

/**
 * Creates a standardized error response
 * @param {string} message - Error message
 * @param {string} code - Error code
 * @param {Object} details - Additional error details
 * @returns {Object} - Standardized error object
 */
export const createError = (message, code = 'VALIDATION_ERROR', details = {}) => {
    return {
        error: true,
        code,
        message,
        details,
        timestamp: new Date().toISOString(),
    };
};

/**
 * Creates a standardized success response
 * @param {Object} data - Response data
 * @param {string} message - Success message
 * @returns {Object} - Standardized success object
 */
export const createSuccess = (data, message = 'Success') => {
    return {
        success: true,
        message,
        data,
        timestamp: new Date().toISOString(),
    };
};
