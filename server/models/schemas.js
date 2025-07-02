import { z } from 'zod/v4';

/**
 * Data schemas and validation for Synapse
 * Uses Zod v4 for runtime validation with built-in JSON Schema generation
 */

// =================================================================
// ZOD VALIDATION SCHEMAS
// =================================================================

/**
 * Quiz Question Schema
 */
export const quizQuestionSchema = z.object({
    id: z.string().min(1).describe('Unique question identifier'),
    question: z.string().min(10).max(1000).describe('The question text'),
    options: z.array(z.string().min(1).max(500)).length(4).describe('Array of exactly 4 answer options'),
    correctAnswer: z.number().int().min(0).max(3).describe('Index of correct answer (0-3)'),
    explanation: z.string().max(1000).optional().describe('Optional explanation for the answer'),
    topic: z.string().max(200).optional().describe('Topic or subject area'),
});

/**
 * Quiz Metadata Schema
 */
export const quizMetadataSchema = z.object({
    sourceFiles: z.array(z.string()).optional().describe('Source file names'),
    totalQuestions: z.number().int().min(1).describe('Total number of questions'),
    estimatedDuration: z.number().int().min(1).describe('Estimated duration in minutes'),
    topics: z.array(z.string()).optional().describe('Main topics covered'),
    pdfSize: z.number().int().optional().describe('Total size of PDF files in bytes'),
    pdfCount: z.number().int().optional().describe('Number of PDF files processed'),
    generatedAt: z.string().datetime().optional().describe('Generation timestamp'),
    model: z.string().optional().describe('AI model used for generation'),
    pdfProcessingEngine: z.string().optional().describe('PDF processing engine used'),
});

/**
 * Quiz Schema
 */
export const quizSchema = z.object({
    id: z.string().min(1).describe('Unique quiz identifier'),
    title: z.string().min(5).max(200).describe('Quiz title'),
    description: z.string().max(1000).optional().describe('Quiz description'),
    questions: z.array(quizQuestionSchema).min(1).max(100).describe('Array of quiz questions'),
    createdAt: z.date().optional().describe('Creation timestamp'),
    updatedAt: z.date().optional().describe('Last update timestamp'),
    metadata: quizMetadataSchema.optional().describe('Quiz metadata'),
});

/**
 * File Upload Schema (for actual file validation)
 */
export const fileUploadSchema = z.object({
    originalname: z.string().min(1).describe('Original filename'),
    mimetype: z.literal('application/pdf').describe('MIME type (must be PDF)'),
    size: z.number().int().max(52428800).describe('File size in bytes (max 50MB)'),
    buffer: z.instanceof(Buffer).describe('File buffer data'),
});

/**
 * File Upload Schema for JSON Schema generation (simplified)
 */
export const fileUploadSchemaForJSON = z.object({
    originalname: z.string().min(1).describe('Original filename'),
    mimetype: z.literal('application/pdf').describe('MIME type (must be PDF)'),
    size: z.number().int().max(52428800).describe('File size in bytes (max 50MB)'),
    buffer: z.string().describe('File buffer data (base64 encoded)'),
});

/**
 * Quiz Generation Options Schema
 */
export const quizGenerationOptionsSchema = z.object({
    questionCount: z.number().int().min(5).max(50).default(15).describe('Number of questions to generate'),
    includeExplanations: z.boolean().default(true).describe('Include explanations for answers'),
    topics: z.array(z.string().max(100)).max(10).optional().describe('Specific topics to focus on'),
    language: z.enum(['en', 'es', 'fr', 'de', 'it', 'pt']).default('en').describe('Language for questions'),
    useSearch: z.boolean().default(false).describe('Enable web search for current information'),
});

/**
 * Quiz Generation Request Schema
 */
export const quizGenerationRequestSchema = z.object({
    files: z.array(fileUploadSchema).min(1).max(5).describe('Array of PDF files to process'),
    options: quizGenerationOptionsSchema.optional().default({}).describe('Generation options'),
});

// =================================================================
// OPENROUTER JSON SCHEMA (Generated from Zod)
// =================================================================

/**
 * Generate OpenRouter-compatible JSON Schema from Zod schema
 */
function createOpenRouterSchema(zodSchema, name, description) {
    return {
        type: 'json_schema',
        json_schema: {
            name: name,
            strict: true,
            schema: {
                ...z.toJSONSchema(zodSchema),
                title: name,
                description: description,
            }
        }
    };
}

/**
 * OpenRouter MCQ Schema - Generated from Zod
 */
const openRouterQuizSchema = z.object({
    quiz: z.object({
        title: z.string().describe('A descriptive title for the quiz based on the PDF content'),
        description: z.string().describe('A brief description of what the quiz covers'),
        questions: z.array(z.object({
            id: z.string().describe('Unique identifier for the question (e.g., q1, q2, etc.)'),
            question: z.string().describe('The question text, clear and concise'),
            options: z.array(z.string()).length(4).describe('Exactly 4 answer options'),
            correctAnswer: z.number().int().min(0).max(3).describe('Index of the correct answer (0, 1, 2, or 3)'),
            explanation: z.string().describe('Brief explanation of why this answer is correct'),
            topic: z.string().describe('Topic or subject area this question covers'),
        })).describe('Array of multiple choice questions'),
        metadata: z.object({
            totalQuestions: z.number().int().min(1).describe('Total number of questions in the quiz'),
            estimatedDuration: z.number().int().min(1).describe('Estimated time to complete in minutes'),
            topics: z.array(z.string()).describe('Main topics covered in the quiz'),
        }).describe('Quiz metadata'),
    }).describe('Complete quiz object'),
});

export const openRouterMCQSchema = createOpenRouterSchema(
    openRouterQuizSchema,
    'mcq_quiz_generation',
    'Generate a multiple choice quiz from PDF content'
);

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
    HI: 'hi',
};

export const FILE_TYPES = {
    PDF: 'application/pdf',
};

// =================================================================
// HELPER FUNCTIONS
// =================================================================

/**
 * Validates data against a Zod schema
 * @param {Object} data - Data to validate
 * @param {z.ZodSchema} schema - Zod schema
 * @returns {Object} - { success, data, error }
 */
export const validate = (data, schema) => {
    const result = schema.safeParse(data);
    return {
        success: result.success,
        data: result.success ? result.data : null,
        error: result.success ? null : result.error,
    };
};

/**
 * Validates data against a Zod schema (throws on error)
 * @param {Object} data - Data to validate
 * @param {z.ZodSchema} schema - Zod schema
 * @returns {Object} - Validated and transformed data
 */
export const validateStrict = (data, schema) => {
    return schema.parse(data);
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

/**
 * Formats Zod errors for user-friendly display
 * @param {z.ZodError} zodError - Zod validation error
 * @returns {Object} - Formatted error object
 */
export const formatZodError = (zodError) => {
    const formattedErrors = zodError.errors.map(error => ({
        field: error.path.join('.'),
        message: error.message,
        code: error.code,
        received: error.received,
        expected: error.expected,
    }));

    return {
        message: 'Validation failed',
        errors: formattedErrors,
        details: {
            errorCount: zodError.errors.length,
            firstError: formattedErrors[0],
        },
    };
};

/**
 * Converts Zod schema to JSON Schema for documentation
 * @param {z.ZodSchema} schema - Zod schema
 * @returns {Object} - JSON Schema object
 */
export const getJSONSchema = (schema) => {
    try {
        return z.toJSONSchema(schema);
    } catch (error) {
        console.warn('Failed to generate JSON Schema:', error.message);
        return { error: 'Schema generation failed', message: error.message };
    }
};

// =================================================================
// SCHEMA EXPORTS FOR EXTERNAL USE
// =================================================================

/**
 * Get JSON Schemas for API documentation (lazy loading to avoid startup crashes)
 * @returns {Object} - Object containing JSON schemas
 */
export const getJSONSchemas = () => {
    return {
        quizQuestion: getJSONSchema(quizQuestionSchema),
        quiz: getJSONSchema(quizSchema),
        fileUpload: getJSONSchema(fileUploadSchema),
        quizGenerationRequest: getJSONSchema(quizGenerationRequestSchema),
        quizGenerationOptions: getJSONSchema(quizGenerationOptionsSchema),
    };
};
