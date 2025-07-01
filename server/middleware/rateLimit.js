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
        trustProxy: config.server.trustProxy,
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

    const createStore = (prefix) => {
        if (!config.server.isProduction) {
            logger.info(`Rate limiting for ${prefix} will use in-memory store (development mode).`);
            return undefined;
        }

        try {
            const client = redisService.getClient();
            logger.info(`Rate limiting for ${prefix} will use Redis store.`);
            return new RedisStore({
                sendCommand: (...args) => client.call(...args),
                prefix: `rl:${prefix}:`,
            });
        } catch (error) {
            logger.error(`Failed to create RedisStore for ${prefix}. Falling back to in-memory store.`, { error: error.message });
            return undefined;
        }
    };

    // Strictest limiter: for quiz generation
    limiters.generation = createRateLimiter({
        windowMs: 1 * 60 * 1000, // 1 minute
        max: config.rateLimit.quizzesPerMinute,
        message: `You can only generate ${config.rateLimit.quizzesPerMinute} quiz(zes) per minute.`,
        store: createStore('generation'),
    });

    // Limiter for polling the processing status (21 requests per minute)
    limiters.processing = createRateLimiter({
        windowMs: 1 * 60 * 1000, // 1 minute
        max: 21, // 20 requests for polling (every 3s) + 1 for buffer
        message: 'Too many status requests. Please try again after a minute.',
        store: createStore('processing'),
    });

    // General purpose limiter for other API calls
    limiters.api = createRateLimiter({
        windowMs: 1 * 60 * 1000, // 1 minute
        max: config.rateLimit.apiRequestsPerMinute,
        message: 'Too many requests. Please try again after a minute.',
        store: createStore('api'),
    });

    logger.info(`Generation Rate Limiter: ${config.rateLimit.quizzesPerMinute} requests per min`);
    logger.info(`Processing Rate Limiter: 21 requests per min`);
    logger.info(`API Rate Limiter: ${config.rateLimit.apiRequestsPerMinute} requests per min`);
}

/**
 * Middleware to apply rate limiter based on route type.
 * @param {string} routeType - The type of route ('generation', 'processing', 'api', 'health').
 * @returns {import('express').RequestHandler}
 */
export const getRateLimiter = (routeType) => {
    if (!config.rateLimit.enabled) {
        return (req, res, next) => next();
    }

    switch (routeType) {
        case 'generation':
            return limiters.generation;
        case 'processing':
            return limiters.processing;
        case 'api':
            return limiters.api;
        case 'health':
            return (req, res, next) => next();
        default:
            // Fallback to the most lenient limiter for safety
            return limiters.api;
    }
};
