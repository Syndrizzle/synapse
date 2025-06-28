import Redis from 'ioredis';
import config from '../config/index.js';
import logger from '../utils/logger.js';

/**
 * Redis client service for Synapse Server
 * Handles all Redis connections and provides helper methods
 */

class RedisService {
    constructor() {
        this.client = null;
        this.isConnected = false;
        this.connectionAttempts = 0;
        this.maxRetries = config.redis.retryAttempts;
    }

    /**
     * Initialize Redis connection
     */
    async connect() {
        try {
            const redisOptions = {
                connectTimeout: config.redis.connectTimeout,
                commandTimeout: config.redis.commandTimeout,
                retryDelayOnFailover: 100,
                maxRetriesPerRequest: this.maxRetries,
                lazyConnect: true,
                keepAlive: 30000,
                family: 4, // Use IPv4
            };

            // Parse Redis URL or use individual options
            if (config.redis.url) {
                this.client = new Redis(config.redis.url, redisOptions);
            } else {
                // Fallback to individual options if URL parsing fails
                this.client = new Redis({
                    host: 'localhost',
                    port: 6379,
                    db: 0,
                    ...redisOptions,
                });
            }

            // Set up event listeners
            this.setupEventListeners();

            // Attempt to connect
            await this.client.connect();

            // Test connection
            const pong = await this.client.ping();
            if (pong === 'PONG') {
                this.isConnected = true;
                logger.info('✅ Redis connection established successfully');
                
                if (config.development.debugMode) {
                    logger.debug(`🔧 Redis URL: ${config.redis.url.replace(/:[^:]*@/, ':***@')}`);
                }
            }

            return this.client;
        } catch (error) {
            logger.error('❌ Failed to connect to Redis:', error.message);
            this.isConnected = false;
            throw error;
        }
    }

    /**
     * Set up Redis event listeners
     */
    setupEventListeners() {
        this.client.on('connect', () => {
            logger.info('🔄 Connecting to Redis...');
        });

        this.client.on('ready', () => {
            this.isConnected = true;
            this.connectionAttempts = 0;
            logger.info('✅ Redis connection ready');
        });

        this.client.on('error', (error) => {
            logger.error('❌ Redis connection error:', error.message);
            this.isConnected = false;
        });

        this.client.on('close', () => {
            logger.warn('🔌 Redis connection closed');
            this.isConnected = false;
        });

        this.client.on('reconnecting', (ms) => {
            this.connectionAttempts++;
            logger.warn(`🔄 Reconnecting to Redis in ${ms}ms (attempt ${this.connectionAttempts})`);
        });

        this.client.on('end', () => {
            logger.warn('🔚 Redis connection ended');
            this.isConnected = false;
        });
    }

    /**
     * Get Redis client instance
     * @returns {Redis} Redis client
     */
    getClient() {
        if (!this.client || !this.isConnected) {
            throw new Error('Redis client is not connected. Call connect() first.');
        }
        return this.client;
    }

    /**
     * Check if Redis is connected
     * @returns {boolean} Connection status
     */
    isReady() {
        return this.isConnected && this.client && this.client.status === 'ready';
    }

    /**
     * Gracefully disconnect from Redis
     */
    async disconnect() {
        if (this.client) {
            logger.info('🔌 Disconnecting from Redis...');
            await this.client.quit();
            this.isConnected = false;
        }
    }

    // =================================================================
    // HELPER METHODS FOR COMMON OPERATIONS
    // =================================================================

    /**
     * Set a key with TTL
     * @param {string} key - Redis key
     * @param {any} value - Value to store
     * @param {number} ttlSeconds - TTL in seconds
     */
    async setWithTTL(key, value, ttlSeconds) {
        const client = this.getClient();
        const serializedValue = typeof value === 'object' ? JSON.stringify(value) : value;
        return await client.setex(key, ttlSeconds, serializedValue);
    }

    /**
     * Get and parse JSON value
     * @param {string} key - Redis key
     * @returns {any} Parsed value or null
     */
    async getJSON(key) {
        const client = this.getClient();
        const value = await client.get(key);
        if (!value) return null;
        
        try {
            return JSON.parse(value);
        } catch (error) {
            logger.warn(`Failed to parse JSON for key ${key}:`, error.message);
            return value; // Return as string if parsing fails
        }
    }

    /**
     * Set JSON value with TTL
     * @param {string} key - Redis key
     * @param {any} value - Value to store
     * @param {number} ttlSeconds - TTL in seconds
     */
    async setJSON(key, value, ttlSeconds = null) {
        const client = this.getClient();
        const serializedValue = JSON.stringify(value);
        
        if (ttlSeconds) {
            return await client.setex(key, ttlSeconds, serializedValue);
        } else {
            return await client.set(key, serializedValue);
        }
    }

    /**
     * Increment a counter with TTL (for rate limiting)
     * @param {string} key - Redis key
     * @param {number} ttlSeconds - TTL in seconds
     * @returns {number} Current count
     */
    async incrementWithTTL(key, ttlSeconds) {
        const client = this.getClient();
        const multi = client.multi();
        multi.incr(key);
        multi.expire(key, ttlSeconds);
        const results = await multi.exec();
        return results[0][1]; // Return the incremented value
    }

    /**
     * Check if key exists
     * @param {string} key - Redis key
     * @returns {boolean} Whether key exists
     */
    async exists(key) {
        const client = this.getClient();
        const result = await client.exists(key);
        return result === 1;
    }

    /**
     * Delete a key
     * @param {string} key - Redis key
     * @returns {number} Number of keys deleted
     */
    async delete(key) {
        const client = this.getClient();
        return await client.del(key);
    }

    /**
     * Get TTL for a key
     * @param {string} key - Redis key
     * @returns {number} TTL in seconds (-1 if no TTL, -2 if key doesn't exist)
     */
    async getTTL(key) {
        const client = this.getClient();
        return await client.ttl(key);
    }

    /**
     * Set TTL for an existing key
     * @param {string} key - Redis key
     * @param {number} ttlSeconds - TTL in seconds
     * @returns {boolean} Whether TTL was set
     */
    async setTTL(key, ttlSeconds) {
        const client = this.getClient();
        const result = await client.expire(key, ttlSeconds);
        return result === 1;
    }

    /**
     * Get all keys matching a pattern
     * @param {string} pattern - Redis key pattern
     * @returns {string[]} Array of matching keys
     */
    async getKeys(pattern) {
        const client = this.getClient();
        return await client.keys(pattern);
    }

    /**
     * Delete all keys matching a pattern
     * @param {string} pattern - Redis key pattern
     * @returns {number} Number of keys deleted
     */
    async deleteByPattern(pattern) {
        const client = this.getClient();
        const keys = await client.keys(pattern);
        if (keys.length === 0) return 0;
        return await client.del(...keys);
    }

    /**
     * Health check for Redis
     * @returns {Object} Health status
     */
    async healthCheck() {
        try {
            const start = Date.now();
            const pong = await this.client.ping();
            const latency = Date.now() - start;

            return {
                status: 'healthy',
                connected: this.isConnected,
                latency: `${latency}ms`,
                response: pong,
                info: {
                    attempts: this.connectionAttempts,
                    maxRetries: this.maxRetries,
                }
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                connected: false,
                error: error.message,
                info: {
                    attempts: this.connectionAttempts,
                    maxRetries: this.maxRetries,
                }
            };
        }
    }
}

// Create and export singleton instance
const redisService = new RedisService();

export default redisService;

// Also export the class for testing
export { RedisService };
