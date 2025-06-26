import express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import config from '../config/index.js';
import openRouterService from '../services/openrouter.js';
import redisService from '../services/redis.js';
import logger from '../utils/logger.js';
import { getRateLimiter } from '../middleware/rateLimit.js';
import { createError, createSuccess, REDIS_KEYS } from '../models/schemas.js';

/**
 * Quiz generation routes
 * Handles PDF upload, text extraction, and MCQ generation
 */

const router = express.Router();

// Parse file size from config
const parseFileSize = (sizeStr) => {
    if (typeof sizeStr === 'number') return sizeStr;
    const units = { B: 1, KB: 1024, MB: 1024 * 1024, GB: 1024 * 1024 * 1024 };
    const match = sizeStr.toString().match(/^(\d+(?:\.\d+)?)\s*(B|KB|MB|GB)$/i);
    if (!match) {
        const numValue = parseFloat(sizeStr);
        if (!isNaN(numValue)) return Math.floor(numValue);
        throw new Error(`Invalid size format: ${sizeStr}`);
    }
    const value = parseFloat(match[1]);
    const unit = match[2].toUpperCase();
    return Math.floor(value * units[unit]);
};

// Configure multer for file uploads (supports 1-5 files)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: parseFileSize(config.upload.maxFileSize),
        files: config.upload.maxFilesCount,
    },
    fileFilter: (req, file, cb) => {
        if (config.upload.allowedFileTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`File type ${file.mimetype} not supported. Allowed types: ${config.upload.allowedFileTypes.join(', ')}`));
        }
    },
});

/**
 * POST /api/quiz/generate
 * Upload PDFs and generate MCQs
 */
router.post('/generate', getRateLimiter(), upload.array('pdfs', config.upload.maxFilesCount), async (req, res, next) => {
    const quizId = uuidv4();
    try {
        logger.info(`[${quizId}] Quiz generation request received.`);

        // Validate file upload
        if (!req.files || req.files.length === 0) {
            return res.status(400).json(createError('No PDF files uploaded', 'FILES_REQUIRED'));
        }

        // Parse request body for generation options
        const generationOptions = {
            questionCount: parseInt(req.body.questionCount, 10) || config.quiz.defaultQuestionCount,
            difficulty: req.body.difficulty || 'mixed',
            includeExplanations: req.body.includeExplanations !== 'false',
            topics: req.body.topics ? req.body.topics.split(',').map(t => t.trim()) : [],
            language: req.body.language || 'en',
        };

        // Store initial processing status
        const processingKey = REDIS_KEYS.QUIZ_PROCESSING(quizId);
        await redisService.setJSON(processingKey, {
            status: 'uploaded',
            startedAt: new Date().toISOString(),
            options: generationOptions,
            fileCount: req.files.length,
            files: req.files.map(f => ({ name: f.originalname, size: f.size })),
        }, 300); // 5 minutes TTL

        // Respond immediately to the client
        res.status(202).json(createSuccess({ quizId }, 'Files uploaded, processing started.'));

        // --- Process in the background ---
        logger.info(`[${quizId}] Starting background processing...`);
        
        // Update status to processing
        await redisService.setJSON(processingKey, {
            status: 'processing',
            startedAt: new Date().toISOString(),
            options: generationOptions,
            fileCount: req.files.length,
        }, 300);

        const pdfBuffers = req.files.map(file => file.buffer);
        const quiz = await openRouterService.generateMCQsFromPDF(pdfBuffers, generationOptions);

        quiz.id = quizId;
        quiz.sourceFiles = req.files.map(file => ({
            name: file.originalname,
            size: file.size,
            type: file.mimetype,
            uploadedAt: new Date().toISOString(),
        }));
        quiz.createdAt = new Date().toISOString();

        const quizKey = REDIS_KEYS.QUIZ(quizId);
        await redisService.setJSON(quizKey, quiz, config.quiz.ttl);

        await redisService.setJSON(processingKey, {
            status: 'completed',
            quizId,
            completedAt: new Date().toISOString(),
        }, 60);

        logger.info(`[${quizId}] Quiz generated successfully.`);

    } catch (error) {
        logger.error(`[${quizId}] Quiz generation failed:`, { message: error.message, stack: error.stack });
        const processingKey = REDIS_KEYS.QUIZ_PROCESSING(quizId);
        await redisService.setJSON(processingKey, {
            status: 'failed',
            error: error.message,
            failedAt: new Date().toISOString(),
        }, 60);
        // We don't call next(error) because the response has already been sent.
    }
});

/**
 * GET /api/quiz/:quizId
 * Retrieve a specific quiz
 */
router.get('/:quizId', async (req, res) => {
    try {
        const { quizId } = req.params;

        // Validate quiz ID format
        if (!quizId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(quizId)) {
            return res.status(400).json(createError(
                'Invalid quiz ID format',
                'INVALID_QUIZ_ID'
            ));
        }

        // Get quiz from Redis
        const quizKey = REDIS_KEYS.QUIZ(quizId);
        const quiz = await redisService.getJSON(quizKey);

        if (!quiz) {
            return res.status(404).json(createError(
                'Quiz not found or expired',
                'QUIZ_NOT_FOUND',
                { quizId }
            ));
        }

        // Return quiz without correct answers
        const clientQuiz = {
            ...quiz,
            questions: quiz.questions.map(q => ({
                id: q.id,
                question: q.question,
                options: q.options,
                topic: q.topic,
                difficulty: q.difficulty,
            })),
        };

        res.json(createSuccess(
            clientQuiz,
            'Quiz retrieved successfully'
        ));

    } catch (error) {
        logger.error('Quiz retrieval failed:', { message: error.message, quizId: req.params.quizId });
        res.status(500).json(createError(
            'Failed to retrieve quiz',
            'RETRIEVAL_FAILED',
            config.server.isDevelopment ? { stack: error.stack } : {}
        ));
    }
});

/**
 * POST /api/quiz/:quizId/submit
 * Submit quiz answers and get results
 */
router.post('/:quizId/submit', getRateLimiter(), async (req, res) => {
    try {
        const { quizId } = req.params;
        const { answers, timeTaken } = req.body;

        // Validate inputs
        if (!quizId || !answers || !Array.isArray(answers)) {
            return res.status(400).json(createError(
                'Quiz ID and answers array are required',
                'INVALID_SUBMISSION'
            ));
        }

        // Get quiz from Redis
        const quizKey = REDIS_KEYS.QUIZ(quizId);
        const quiz = await redisService.getJSON(quizKey);

        if (!quiz) {
            return res.status(404).json(createError(
                'Quiz not found or expired',
                'QUIZ_NOT_FOUND',
                { quizId }
            ));
        }

        // Check if quiz has already been submitted
        const resultsKey = REDIS_KEYS.QUIZ_RESULTS(quizId);
        const existingResults = await redisService.getJSON(resultsKey);

        if (existingResults) {
            return res.status(409).json(createError(
                'Quiz has already been submitted',
                'QUIZ_ALREADY_SUBMITTED',
                { 
                    quizId,
                    submittedAt: existingResults.submittedAt,
                    score: `${existingResults.score}/${existingResults.totalQuestions}`,
                    percentage: `${existingResults.percentage}%`
                }
            ));
        }

        // Validate answers format
        if (answers.length !== quiz.questions.length) {
            return res.status(400).json(createError(
                `Expected ${quiz.questions.length} answers, received ${answers.length}`,
                'ANSWER_COUNT_MISMATCH',
                { expected: quiz.questions.length, received: answers.length }
            ));
        }

        // Calculate results
        const results = {
            quizId,
            submittedAt: new Date().toISOString(),
            totalQuestions: quiz.questions.length,
            correctAnswers: 0,
            incorrectAnswers: 0,
            score: 0,
            percentage: 0,
            timeTaken: timeTaken || null,
            questionResults: [],
        };

        // Check each answer
        quiz.questions.forEach((question, index) => {
            const userAnswer = answers[index];
            const isCorrect = userAnswer === question.correctAnswer;
            
            if (isCorrect) {
                results.correctAnswers++;
            } else {
                results.incorrectAnswers++;
            }

            results.questionResults.push({
                questionId: question.id,
                userAnswer,
                correctAnswer: question.correctAnswer,
                isCorrect,
                question: question.question,
                options: question.options,
                explanation: question.explanation || null,
                topic: question.topic,
                difficulty: question.difficulty,
            });
        });

        // Calculate score and percentage
        results.score = results.correctAnswers;
        results.percentage = Math.round((results.correctAnswers / results.totalQuestions) * 100);

        // Determine performance level
        if (results.percentage >= 80) {
            results.performance = 'excellent';
        } else if (results.percentage >= 60) {
            results.performance = 'good';
        } else if (results.percentage >= 40) {
            results.performance = 'average';
        } else {
            results.performance = 'needs_improvement';
        }

        // Store results in Redis (reuse the already declared resultsKey)
        await redisService.setJSON(resultsKey, results, config.quiz.ttl);

        logger.info(`Quiz submitted: ${quizId} - Score: ${results.score}/${results.totalQuestions} (${results.percentage}%)`);

        const responseData = {
            ...results,
            performance: results.performance,
            suggestions: results.percentage < 60 ? [
                'Review the topics you found challenging',
                'Try generating another quiz to practice more',
            ] : ['Great job! Keep practicing to maintain your performance.'],
        };
        res.json(createSuccess(
            responseData,
            'Quiz submitted successfully'
        ));

    } catch (error) {
        logger.error('Quiz submission failed:', { message: error.message, quizId: req.params.quizId });
        res.status(500).json(createError(
            'Failed to submit quiz',
            'SUBMISSION_FAILED',
            config.server.isDevelopment ? { stack: error.stack } : {}
        ));
    }
});

/**
 * GET /api/quiz/:quizId/results
 * Get quiz results for a session
 */
router.get('/:quizId/results', async (req, res) => {
    try {
        const { quizId } = req.params;

        // Get results from Redis
        const resultsKey = REDIS_KEYS.QUIZ_RESULTS(quizId);
        const results = await redisService.getJSON(resultsKey);

        if (!results) {
            // Return a success response with found: false instead of 404
            return res.json(createSuccess({ found: false }, 'Results not found'));
        }

        res.json(createSuccess(
            { ...results, found: true },
            'Results retrieved successfully'
        ));

    } catch (error) {
        logger.error('Results retrieval failed:', { message: error.message, quizId: req.params.quizId });
        res.status(500).json(createError(
            'Failed to retrieve results',
            'RESULTS_RETRIEVAL_FAILED',
            config.server.isDevelopment ? { stack: error.stack } : {}
        ));
    }
});

/**
 * GET /api/quiz/processing/:quizId
 * Check processing status of a quiz
 */
router.get('/processing/:quizId', async (req, res) => {
    try {
        const { quizId } = req.params;
        
        const processingKey = REDIS_KEYS.QUIZ_PROCESSING(quizId);
        const status = await redisService.getJSON(processingKey);

        if (!status) {
            return res.status(404).json(createError(
                'Processing status not found',
                'STATUS_NOT_FOUND'
            ));
        }

        res.json(createSuccess(
            status,
            'Processing status retrieved'
        ));

    } catch (error) {
        logger.error('Status check failed:', { message: error.message, quizId: req.params.quizId });
        res.status(500).json(createError(
            'Failed to check processing status',
            'STATUS_CHECK_FAILED'
        ));
    }
});

export default router;
