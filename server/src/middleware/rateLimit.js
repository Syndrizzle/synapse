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

    let store = {};
    if (config.server.isProduction) {
        try {
            const client = redisService.getClient();
            store.general = new RedisStore({ sendCommand: (...args) => client.call(...args), prefix: 'rl:general:' });
            store.health = new RedisStore({ sendCommand: (...args) => client.call(...args), prefix: 'rl:health:' });
            store.quiz = new RedisStore({ sendCommand: (...args) => client.call(...args), prefix: 'rl:quiz:' });
            store.authorized = new RedisStore({ sendCommand: (...args) => client.call(...args), prefix: 'rl:authorized:' });
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
        store: store.general,
    });

    limiters.health = createRateLimiter({
        windowMs: config.rateLimit.health.windowMinutes * 60 * 1000,
        max: config.rateLimit.health.requests,
        message: `Too many health check requests. Please try again after ${config.rateLimit.health.windowMinutes} minutes.`,
        store: store.health,
    });

    limiters.quiz = createRateLimiter({
        windowMs: config.rateLimit.quiz.windowMinutes * 60 * 1000,
        max: config.rateLimit.quiz.requests,
        message: `Too many quiz requests. Please try again after ${config.rateLimit.quiz.windowMinutes} minutes.`,
        store: store.quiz,
    });

    limiters.authorized = createRateLimiter({
        windowMs: config.rateLimit.authorized.windowMinutes * 60 * 1000,
        max: config.rateLimit.authorized.requests,
        message: `Too many requests. Please try again after ${config.rateLimit.authorized.windowMinutes} minutes.`,
        store: store.authorized,
    });

    logger.info(`General Rate Limiter: ${config.rateLimit.general.requests} requests per ${config.rateLimit.general.windowMinutes} min`);
    logger.info(`Health Check Rate Limiter: ${config.rateLimit.health.requests} requests per ${config.rateLimit.health.windowMinutes} min`);
    logger.info(`Quiz Rate Limiter: ${config.rateLimit.quiz.requests} requests per ${config.rateLimit.quiz.windowMinutes} min`);
    logger.info(`Authorized Rate Limiter: ${config.rateLimit.authorized.requests} requests per ${config.rateLimit.authorized.windowMinutes} min`);
}

/**
 * Middleware to apply the correct rate limiter based on the route and origin.
 * @param {string} routeType - The type of route ('health', 'quiz', 'general').
 * @returns {import('express').RequestHandler}
 */
export const getRateLimiter = (routeType) => (req, res, next) => {
    if (!config.rateLimit.enabled) {
        return next();
    }

    const origin = req.get('origin');
    const isAuthorized = origin && config.security.authorizedDomains.includes(origin);

    if (isAuthorized) {
        switch (routeType) {
            case 'health':
                return limiters.health(req, res, next);
            case 'quiz':
                return limiters.quiz(req, res, next);
            default:
                return limiters.authorized(req, res, next);
        }
    }

    return limiters.general(req, res, next);
};
