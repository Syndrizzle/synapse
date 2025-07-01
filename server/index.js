import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import config, { validateConfig, logConfig } from './config/index.js';
import redisService from './services/redis.js';
import logger from './utils/logger.js';
import { applySecurity, configureCORS } from './middleware/security.js';
import { initializeRateLimiters, getRateLimiter } from './middleware/rateLimit.js';
import { createError } from './models/schemas.js';
import openRouterService from './services/openrouter.js';
import { quizRoutes, processingRouter } from './routes/quiz.js';

/**
 * Synapse Server
 * A bulletproof backend for PDF-to-MCQ generation using OpenRouter
 */

// =================================================================
// SERVER INITIALIZATION
// =================================================================

const app = express();

/**
 * Validate configuration on startup
 */
function validateConfiguration() {
    logger.info('🔍 Validating configuration...');

    const errors = validateConfig();
    if (errors.length > 0) {
        logger.error('❌ Configuration validation failed:');
        errors.forEach(error => logger.error(`   - ${error}`));

        if (config.server.isProduction) {
            logger.error('🚫 Server cannot start with invalid configuration in production');
            process.exit(1);
        } else {
            logger.warn('⚠️  Server starting with configuration warnings in development mode');
        }
    } else {
        logger.info('✅ Configuration validation passed');
    }

    // Log configuration in debug mode
    logConfig();
}

/**
 * Initialize Redis connection
 */
async function initializeRedis() {
    try {
        logger.info('🔄 Initializing Redis connection...');
        await redisService.connect();
        // Initialize rate limiters now that Redis is connected
        initializeRateLimiters();
    } catch (error) {
        logger.error('❌ Failed to connect to Redis:', error.message);

        if (config.server.isProduction) {
            logger.error('🚫 Redis is required in production. Exiting...');
            process.exit(1);
        } else {
            logger.warn('⚠️  Continuing without Redis in development mode');
        }
    }
}

/**
 * Configure Express middleware
 */
function configureMiddleware() {
    logger.info('🔧 Configuring middleware...');

    // Trust proxy setting for rate limiting
    if (config.server.trustProxy) {
        app.set('trust proxy', 1); // Adjust the number of proxies as needed
        logger.info('✅ Trust proxy enabled');
    }

    // HTTP request logging
    const morganFormat = config.server.isProduction ? 'combined' : 'dev';
    app.use(morgan(morganFormat, { stream: logger.stream }));

    // Apply security middleware (this includes request logging, helmet, compression, etc.)
    applySecurity(app);

    // CORS configuration
    app.use(cors(configureCORS()));

    // Body parsing middleware
    app.use(express.json({
        limit: config.security.maxRequestSize,
        strict: true,
    }));
    app.use(express.urlencoded({
        extended: true,
        limit: config.security.maxRequestSize,
    }));



    logger.info('✅ Middleware configured');
}

/**
 * Setup routes
 */
function setupRoutes() {
    logger.info('🛣️  Setting up routes...');

// Health check endpoint
    app.get('/api/v1/health', getRateLimiter('health'), async (req, res) => {
        try {
            // Base health payload
            const healthStatus = {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                version: process.env.npm_package_version || '1.0.0',
            };

            // Always expose upload capacity so that the frontend can adapt automatically
            healthStatus.capacity = {
                maxFileSize: config.upload.maxFileSize,
                maxFiles: config.upload.maxFilesCount,
                allowedFileTypes: config.upload.allowedFileTypes,
                searchEnabled: config.tavily.enabled,
            };

            // Only expose additional diagnostic information when NOT in production
            if (!config.server.isProduction) {
                healthStatus.environment = config.server.nodeEnv;
            }


            // Check Redis health (only include detailed info outside production)
            if (!config.server.isProduction && redisService.isReady()) {
                const redisHealth = await redisService.healthCheck();
                healthStatus.redis = redisHealth;
            } else if (!config.server.isProduction) {
                healthStatus.redis = {
                    status: 'disconnected',
                    connected: false,
                };
            }

            // Include OpenRouter diagnostic data only outside production
            if (!config.server.isProduction) {
                healthStatus.openrouter = {
                    configured: !!config.openrouter.apiKey && config.openrouter.apiKey !== 'your_openrouter_api_key_here',
                    model: config.openrouter.model,
                    baseUrl: config.openrouter.baseUrl,
                };
            }

            // Check OpenRouter service status only outside production
            if (!config.server.isProduction) {
                healthStatus.openrouterService = openRouterService.getStatus();
            }

            res.status(200).json(healthStatus);
        } catch (error) {
            logger.error('Health check error:', error);
            res.status(503).json({
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                error: error.message,
            });
        }
    });

    // API routes

    // Setup route modules
    app.use('/api/v1/quiz', quizRoutes);
    app.use('/api/v1/quiz/processing', processingRouter);


    // Catch-all for undefined API routes
    app.use('/api/v1', (req, res, next) => {
        // Only handle if no other route matched
        if (req.path.startsWith('/api/')) {
            res.status(404).json(createError(
                'API endpoint not found',
                'ENDPOINT_NOT_FOUND',
                { path: req.path, method: req.method }
            ));
        } else {
            next();
        }
    });

    // =================================================================
    // SERVE FRONTEND
    // =================================================================

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    // Serve static files from the React app
    const clientDistPath = path.join(__dirname, 'static');
    app.use(express.static(clientDistPath));

    // The "catchall" handler: for any request that doesn't
    // match one above, send back React's index.html file.
    app.get('*', (req, res) => {
        res.sendFile(path.resolve(clientDistPath, 'index.html'));
    });


    logger.info('✅ Routes configured');
}

/**
 * Setup global error handling
 */
function setupErrorHandling() {
    // Global error handler
    app.use((error, req, res, next) => {
        logger.error('Global error handler:', {
            message: error.message,
            code: error.code,
            stack: error.stack,
            isOperational: error.isOperational,
        });

        // Determine if error is operational or programming error
        const isOperational = error.isOperational || error.status || error.statusCode;

        if (!isOperational && config.server.isProduction) {
            // Don't leak error details in production for non-operational errors
            res.status(500).json(createError(
                'Internal server error',
                'INTERNAL_ERROR',
                {}
            ));
        } else {
            // Send detailed error in development or for operational errors
            const statusCode = error.status || error.statusCode || 500;
            res.status(statusCode).json(createError(
                error.message || 'An unexpected error occurred',
                error.code || 'UNKNOWN_ERROR',
                config.server.isDevelopment ? { stack: error.stack } : {}
            ));
        }
    });

    logger.info('✅ Error handling configured');
}

/**
 * Setup graceful shutdown
 */
function setupGracefulShutdown() {
    const gracefulShutdown = async (signal) => {
        logger.info(`\n📨 Received ${signal}. Starting graceful shutdown...`);

        // Close server
        if (global.server) {
            global.server.close(async () => {
                logger.info('🔌 HTTP server closed');

                // Close Redis connection
                try {
                    await redisService.disconnect();
                } catch (error) {
                    logger.error('❌ Error closing Redis connection:', error.message);
                }

                logger.info('✅ Graceful shutdown completed');
                process.exit(0);
            });
        } else {
            process.exit(0);
        }
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions and rejections
    process.on('uncaughtException', (error) => {
        logger.error('🚨 Uncaught Exception:', error);
        if (config.server.isProduction) {
            gracefulShutdown('UNCAUGHT_EXCEPTION');
        }
    });

    process.on('unhandledRejection', (reason, promise) => {
        logger.error('🚨 Unhandled Rejection:', reason);
        if (config.server.isProduction) {
            gracefulShutdown('UNHANDLED_REJECTION');
        }
    });
}

/**
 * Start the server
 */
async function startServer() {
    try {
        logger.info('🚀 Starting Synapse Server...');
        logger.info(`📍 Environment: ${config.server.nodeEnv}`);
        logger.info(`🔧 Debug Mode: ${config.development.debugMode ? 'ON' : 'OFF'}`);

        // Validate configuration
        validateConfiguration();

        // Initialize Redis
        await initializeRedis();

        // Configure middleware
        configureMiddleware();

        // Setup routes
        setupRoutes();

        // Setup error handling
        setupErrorHandling();

        // Setup graceful shutdown
        setupGracefulShutdown();

        // Start listening
        const server = app.listen(config.server.port, config.server.host, () => {
            const address = config.server.host === '0.0.0.0' ? 'localhost' : config.server.host;
            logger.info('✅ Server started successfully!');
            logger.info(`🌐 Server running on http://${config.server.host}:${config.server.port}`);
            logger.info(`📡 Health check: http://${config.server.host}:${config.server.port}/api/v1/health`);
            logger.info(`🌐 API Base URL: http://${config.server.host}:${config.server.port}/api/v1`);

            if (config.development.debugMode) {
                logger.debug('🔍 Debug mode enabled - detailed logging active');
            }

            logger.info('🎯 Ready to process MCQ generation requests!');
        });

        // Set server timeout
        server.timeout = 300000; // 5 minutes

        // Store server reference for graceful shutdown
        global.server = server;

        return server;

    } catch (error) {
        logger.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// =================================================================
// START SERVER
// =================================================================

// Start the server
startServer().catch((error) => {
    logger.error('💥 Server startup failed:', error);
    process.exit(1);
});

// Export app for testing
export default app;
export { startServer };
