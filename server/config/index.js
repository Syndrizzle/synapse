import 'dotenv/config';

/**
 * Centralized configuration management for Synapse Server
 * All environment variables are processed and validated here
 */

// Helper function to parse boolean values
const parseBooleanSafe = (value, defaultValue = false) => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
        return value.toLowerCase() === 'true';
    }
    return defaultValue;
};

// Helper function to parse integers with validation
const parseIntSafe = (value, defaultValue, min = null, max = null) => {
    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed)) return defaultValue;
    if (min !== null && parsed < min) return defaultValue;
    if (max !== null && parsed > max) return defaultValue;
    return parsed;
};

// Helper function to parse floats with validation
const parseFloatSafe = (value, defaultValue, min = null, max = null) => {
    const parsed = Number.parseFloat(value);
    if (Number.isNaN(parsed)) return defaultValue;
    if (min !== null && parsed < min) return defaultValue;
    if (max !== null && parsed > max) return defaultValue;
    return parsed;
};

// Helper function to parse comma-separated lists
const parseListSafe = (value, defaultValue = []) => {
    if (!value || typeof value !== 'string') return defaultValue;
    return value.split(',').map(item => item.trim()).filter(Boolean);
};

const config = {
    // =================================================================
    // SERVER CONFIGURATION
    // =================================================================
    server: {
        host: process.env.HOST || (process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost'),
        port: parseIntSafe(process.env.PORT, 3000, 1, 65535),
        nodeEnv: process.env.NODE_ENV || 'development',
        isDevelopment: (process.env.NODE_ENV || 'development') === 'development',
        isProduction: process.env.NODE_ENV === 'production',
        isTest: process.env.NODE_ENV === 'test',
        trustProxy: parseBooleanSafe(process.env.TRUST_PROXY, false),
    },

    // =================================================================
    // OPENROUTER API CONFIGURATION
    // =================================================================
    openrouter: {
        apiKey: process.env.OPENROUTER_API_KEY || '',
        baseUrl: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
        model: process.env.OPENROUTER_MODEL || 'google/gemini-2.5-flash',
        pdfProcessingEngine: process.env.PDF_PROCESSING_ENGINE || 'native',
        
        // Advanced settings
        temperature: parseFloatSafe(process.env.MCQ_TEMPERATURE, 0.3, 0.0, 1.0),
        maxTokens: parseIntSafe(process.env.MCQ_MAX_TOKENS, 4000, 100, 8000),
        timeout: parseIntSafe(process.env.OPENROUTER_TIMEOUT, 120000, 30000, 300000), // 2 minutes default
        maxRetries: parseIntSafe(process.env.OPENROUTER_MAX_RETRIES, 2, 0, 5),
    },

    // =================================================================
    // TAVILY API CONFIGURATION
    // =================================================================
    tavily: {
        apiKey: process.env.TAVILY_API_KEY || '',
        enabled: !!process.env.TAVILY_API_KEY,
    },

    // =================================================================
    // REDIS CONFIGURATION
    // =================================================================
    redis: {
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        connectTimeout: parseIntSafe(process.env.REDIS_CONNECT_TIMEOUT, 10000, 1000),
        commandTimeout: parseIntSafe(process.env.REDIS_COMMAND_TIMEOUT, 5000, 1000),
        retryAttempts: parseIntSafe(process.env.REDIS_RETRY_ATTEMPTS, 3, 1, 10),
    },

    // =================================================================
    // QUIZ CONFIGURATION
    // =================================================================
    quiz: {
        minQuestions: parseIntSafe(process.env.MIN_QUIZ_LENGTH, 5, 1, 50),
        maxQuestions: parseIntSafe(process.env.MAX_QUIZ_LENGTH, 50, 10, 100),
        ttl: parseIntSafe(process.env.QUIZ_TTL, 86400, 3600, 604800), // 24 hours default in seconds
    },

    // =================================================================
    // FILE UPLOAD LIMITS
    // =================================================================
    upload: {
        maxFileSize: parseIntSafe(process.env.MAX_FILE_SIZE, 10485760), // 10MB default
        maxFilesCount: parseIntSafe(process.env.MAX_FILES_COUNT, 5, 1, 20),
        allowedFileTypes: parseListSafe(process.env.ALLOWED_FILE_TYPES, ['application/pdf']),
    },

    // =================================================================
    // RATE LIMITING CONFIGURATION
    // =================================================================
    rateLimit: {
        enabled: parseBooleanSafe(process.env.ENABLE_RATE_LIMITING, true),
        // How many quizzes can be generated per minute
        quizzesPerMinute: parseIntSafe(process.env.RATE_LIMIT_QUIZZES_PER_MINUTE, 2, 1, 100),
        // General API limit for other requests
        apiRequestsPerMinute: parseIntSafe(process.env.RATE_LIMIT_API_REQUESTS_PER_MINUTE, 50, 10, 1000),
    },

    // =================================================================
    // SECURITY CONFIGURATION
    // =================================================================
    security: {
        corsOrigins: parseListSafe(process.env.CORS_ORIGINS, ['http://localhost:3000', 'http://localhost:5173']),
        authorizedDomains: parseListSafe(process.env.AUTHORIZED_DOMAINS, []),
        maxRequestSize: process.env.MAX_REQUEST_SIZE || '10mb',
    },

    // =================================================================
    // LOGGING CONFIGURATION
    // =================================================================
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        enableFileLogging: parseBooleanSafe(process.env.ENABLE_FILE_LOGGING, false),
        filePath: process.env.LOG_FILE_PATH || './logs/server.log',
    },

    // =================================================================
    // DEVELOPMENT/DEBUG SETTINGS
    // =================================================================
    development: {
        debugMode: parseBooleanSafe(process.env.DEBUG_MODE, false),
    },
};

// =================================================================
// CONFIGURATION VALIDATION
// =================================================================

/**
 * Validates critical configuration values
 * @returns {Array} Array of validation errors (empty if valid)
 */
export const validateConfig = () => {
    const errors = [];

    // Check critical required values
    if (!config.openrouter.apiKey || config.openrouter.apiKey === 'your_openrouter_api_key_here') {
        errors.push('OPENROUTER_API_KEY is required and must be set to a valid API key');
    }

    if (!config.tavily.apiKey) {
        console.warn('⚠️  TAVILY_API_KEY is not set. Web search functionality will be disabled.');
        config.tavily.enabled = false;
    }

    if (!config.redis.url || config.redis.url === 'redis://localhost:6379') {
        console.warn('⚠️  Using default Redis URL. Make sure Redis is running on localhost:6379');
    }

    // Validate numeric ranges
    if (config.quiz.minQuestions >= config.quiz.maxQuestions) {
        errors.push('MIN_QUIZ_LENGTH must be less than MAX_QUIZ_LENGTH');
    }

    return errors;
};

/**
 * Logs current configuration (safe - doesn't log secrets)
 */
export const logConfig = () => {
    if (config.development.debugMode) {
        console.log('🔧 Configuration loaded:');
        console.log(`   Server: ${config.server.nodeEnv} on port ${config.server.port}`);
        console.log(`   OpenRouter Model: ${config.openrouter.model}`);
        console.log(`   Redis: ${config.redis.url.replace(/:[^:]*@/, ':***@')}`); // Hide password
        console.log(`   Quiz: ${config.quiz.minQuestions}-${config.quiz.maxQuestions} questions (dynamic based on content)`);
        console.log(`   Max File Size: ${(config.upload.maxFileSize / 1024 / 1024).toFixed(1)}MB`);
        console.log(`   CORS Origins: ${config.security.corsOrigins.join(', ')}`);
        console.log(`   Allowed Domains: ${config.security.authorizedDomains.join(', ')}`);

    }
};

export default config;
