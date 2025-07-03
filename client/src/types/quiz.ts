/**
 * Quiz-related TypeScript interfaces
 * Based on server/src/models/schemas.js for consistency
 */

// =================================================================
// BASE INTERFACES
// =================================================================

/**
 * Base interface for quiz identification
 */
export interface QuizIdentifier {
  id: string;
}

/**
 * Quiz Question interface
 */
export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  topic: string;
}

/**
 * Quiz Metadata interface
 */
export interface QuizMetadata {
  totalQuestions: number;
  estimatedDuration: number; // in minutes
  topics: string[];
  sourceFiles?: string[];
}

// =================================================================
// CORE QUIZ INTERFACES
// =================================================================

/**
 * Complete Quiz Data interface
 */
export interface QuizData extends QuizIdentifier {
  title: string;
  description: string;
  questions: Question[];
  metadata: QuizMetadata;
  createdAt?: string;
  updatedAt?: string;
}

// =================================================================
// QUIZ RESULTS INTERFACES
// =================================================================

/**
 * Individual Question Result - extends Question with user answer data
 */
export interface QuestionResult extends Question {
  userAnswer: number | null;
  isCorrect: boolean;
}

/**
 * Quiz Results Statistics
 */
export interface QuizResultsStats {
  correctAnswers: number;
  incorrectAnswers: number;
  score: number;
  percentage: number;
  timeTaken: number; // in seconds
  performance: 'excellent' | 'good' | 'average' | 'needs_improvement';
}

/**
 * Complete Quiz Results Data
 */
export interface QuizResultsData extends QuizIdentifier, QuizResultsStats {
  submittedAt: string;
  questionResults: QuestionResult[];
  found?: boolean; // for checking if results exist
}

// =================================================================
// COMPONENT PROP INTERFACES
// =================================================================

/**
 * Props for QuizArea component
 */
export interface QuizAreaProps {
  question: Question;
  questionIndex: number;
  selectedAnswer: number | null;
  onSelectAnswer: (answerIndex: number) => void;
  textureUrl: string;
}

/**
 * Props for QuizNav component
 */
export interface QuizNavProps {
  currentQuestionIndex: number;
  answers: (number | null)[];
  visited: boolean[];
  onGoToQuestion: (index: number) => void;
}

/**
 * Props for ResultsNav component
 */
export interface ResultsNavProps {
  questionResults: QuestionResult[];
  selectedQuestionIndex: number;
  onQuestionSelect: (index: number) => void;
}

/**
 * Props for QuizResultsPDF component
 */
export interface QuizResultsPDFProps {
  resultsData: QuizResultsData;
}

// =================================================================
// API RESPONSE INTERFACES
// =================================================================

/**
 * Standard API Response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

/**
 * Quiz generation options
 */
export interface QuizGenerationOptions {
  questionCount?: number;
  includeExplanations?: boolean;
  topics?: string[];
  language?: 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt';
}

// =================================================================
// CONSTANTS
// =================================================================

export const QUIZ_STATUS = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  ABANDONED: 'abandoned',
  EXPIRED: 'expired',
} as const;

export const PERFORMANCE_LEVELS = {
  EXCELLENT: 'excellent',
  GOOD: 'good',
  AVERAGE: 'average',
  NEEDS_IMPROVEMENT: 'needs_improvement',
} as const;

export type QuizStatus = typeof QUIZ_STATUS[keyof typeof QUIZ_STATUS];
export type PerformanceLevel = typeof PERFORMANCE_LEVELS[keyof typeof PERFORMANCE_LEVELS];
