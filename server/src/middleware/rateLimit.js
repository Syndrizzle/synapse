import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import config from '../config/index.js';
import redisService from '../services/redis.js';
import logger from '../utils/logger.js';

// Simple rate limiter
let rateLimiter = (req, res, next) => next(); // Default no-op

/**
 * Initializes a single, simple rate limiter
 */
export function initializeRateLimiters() {
    if (!config.rateLimit.enabled) {
        logger.info('Rate limiting is disabled');
        return;
    }

    logger.info('Initializing rate limiter...');

    let generalStore, authorizedStore;
    // Use Redis for storage in production for persistence across restarts/instances
    if (config.server.isProduction) {
        try {
            const client = redisService.getClient();
            generalStore = new RedisStore({
                // @ts-ignore - `rate-limit-redis` types might not match `redis` v4
                sendCommand: (...args) => client.call(...args),
                prefix: 'rl:general:',
            });
            authorizedStore = new RedisStore({
                // @ts-ignore
                sendCommand: (...args) => client.call(...args),
                prefix: 'rl:authorized:',
            });
        } catch (error) {
            logger.error('Failed to create RedisStore. Falling back to in-memory store.', { error: error.message });
            // Fallback to memory store if RedisStore fails
        }
    }

    const generalLimiter = rateLimit({
        windowMs: config.rateLimit.windowMinutes * 60 * 1000,
        max: config.rateLimit.requests,
        message: {
            error: true,
            code: 'RATE_LIMITED',
            message: `Too many requests. Please try again after ${config.rateLimit.windowMinutes} minutes.`,
            timestamp: new Date().toISOString(),
        },
        store: generalStore,
        standardHeaders: true,
        legacyHeaders: false,
    });

    const authorizedLimiter = rateLimit({
        windowMs: config.rateLimit.authorizedWindowMinutes * 60 * 1000,
        max: config.rateLimit.authorizedRequests,
        message: {
            error: true,
            code: 'RATE_LIMITED',
            message: `Too many requests. Please try again after ${config.rateLimit.authorizedWindowMinutes} minutes.`,
            timestamp: new Date().toISOString(),
        },
        store: authorizedStore,
        standardHeaders: true,
        legacyHeaders: false,
    });

    rateLimiter = (req, res, next) => {
        const origin = req.get('origin');
        if (origin && config.security.authorizedDomains.includes(origin)) {
            return authorizedLimiter(req, res, next);
        }
        return generalLimiter(req, res, next);
    };

    if (config.server.isProduction) {
        logger.info('Rate limiting will use Redis store.');
    } else {
        logger.info('Rate limiting will use in-memory store (development mode).');
    }

    logger.info(`Rate limiter initialized: ${config.rateLimit.requests} requests per ${config.rateLimit.windowMinutes} minutes`);
}

/**
 * Get the rate limiter middleware
 */
export const getRateLimiter = () => rateLimiter;
