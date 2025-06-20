import helmet from 'helmet';
import compression from 'compression';
import config from '../config/index.js';
import logger from '../utils/logger.js';

/**
 * Simple security middleware configuration
 */

/**
 * Basic security headers middleware
 */
export const basicSecurity = (req, res, next) => {
    // Remove server information
    res.removeHeader('X-Powered-By');
    
    // Add basic security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    next();
};

/**
 * Simple request size limiter
 */
export const limitRequestSize = (req, res, next) => {
    const contentLength = parseInt(req.get('content-length'), 10);
    const maxSize = parseInt(config.security.maxRequestSize.replace(/[^\d]/g, ''), 10) * 1024 * 1024; // Convert to bytes

    if (contentLength && contentLength > maxSize) {
        return res.status(413).json({
            error: true,
            code: 'REQUEST_TOO_LARGE',
            message: `Request size exceeds maximum allowed size of ${config.security.maxRequestSize}`,
            timestamp: new Date().toISOString(),
        });
    }

    next();
};

/**
 * Simple CORS configuration
 */
export const configureCORS = () => {
    return {
        origin: (origin, callback) => {
            // Allow requests with no origin (mobile apps, etc.)
            if (!origin) return callback(null, true);
            
            // Check if origin is in allowed list
            if (config.security.corsOrigins.includes(origin) || config.security.corsOrigins.includes('*')) {
                return callback(null, true);
            }
            
            // Reject unauthorized origins
            callback(new Error('Not allowed by CORS'));
        },
        credentials: false,
        methods: ['GET', 'POST', 'OPTIONS'],
        allowedHeaders: [
            'Content-Type',
            'Accept',
        ],
        maxAge: 86400, // 24 hours
    };
};

/**
 * Apply simple security middleware to app
 */
export const applySecurity = (app) => {
    // Basic helmet with minimal config
    app.use(helmet({
        contentSecurityPolicy: config.server.isDevelopment ? false : undefined,
    }));
    
    // Basic compression
    app.use(compression());
    
    // Basic security headers
    app.use(basicSecurity);
    
    // Request size limiting
    app.use(limitRequestSize);
    
    logger.info('🔒 Simple security middleware configured');
};
