import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import config from '../config/index.js';
import redisService from '../services/redis.js';
import logger from '../utils/logger.js';

// Simple rate limiter
let rateLimiter = (req, res, next) => next(); // Default no-op

/**
 * Creates a rate limiter with a specific configuration.
 * @param {object} options - The options for the rate limiter.
 * @param {number} options.windowMs - The time window in milliseconds.
 * @param {number} options.max - The max number of requests.
 * @param {string} options.message - The message to send when the limit is exceeded.
 * @param {object} options.store - The store to use for the rate limiter.
 * @returns {import('express-rate-limit').RateLimitRequestHandler}
 */
const createRateLimiter = ({ windowMs, max, message, store }) => {
    return rateLimit({
        windowMs,
        max,
        message: {
            error: true,
            code: 'RATE_LIMITED',
            message,
            timestamp: new Date().toISOString(),
        },
        store,
        standardHeaders: true,
        legacyHeaders: false,
    });
};

// Create a factory for rate limiters to avoid code duplication
const limiters = {};

/**
 * Initializes the rate limiters for different routes.
 */
export function initializeRateLimiters() {
    if (!config.rateLimit.enabled) {
        logger.info('Rate limiting is disabled');
        return;
    }

    logger.info('Initializing rate limiters...');

    let store;
    if (config.server.isProduction) {
        try {
            const client = redisService.getClient();
            store = new RedisStore({ sendCommand: (...args) => client.call(...args), prefix: 'rl:general:' });
            logger.info('Rate limiting will use Redis store.');
        } catch (error) {
            logger.error('Failed to create RedisStore. Falling back to in-memory store.', { error: error.message });
        }
    } else {
        logger.info('Rate limiting will use in-memory store (development mode).');
    }

    limiters.general = createRateLimiter({
        windowMs: config.rateLimit.general.windowMinutes * 60 * 1000,
        max: config.rateLimit.general.requests,
        message: `Too many requests. Please try again after ${config.rateLimit.general.windowMinutes} minutes.`,
        store,
    });

    logger.info(`General Rate Limiter: ${config.rateLimit.general.requests} requests per ${config.rateLimit.general.windowMinutes} min`);
}

/**
 * Middleware to apply rate limiter based on route type.
 * Health endpoints for static files have no rate limiting.
 * All other endpoints use the general rate limiter (3 requests per minute).
 * @param {string} routeType - The type of route ('health', 'general').
 * @returns {import('express').RequestHandler}
 */
export const getRateLimiter = (routeType) => (req, res, next) => {
    if (!config.rateLimit.enabled) {
        return next();
    }

    // No rate limiting for health checks on static files
    if (routeType === 'health') {
        return next();
    }

    // Apply general rate limiter for all other requests
    return limiters.general(req, res, next);
};
