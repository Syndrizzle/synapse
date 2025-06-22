/**
 * Environment configuration for Synapse frontend
 */

export const config = {
  // API Configuration
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  
  // Upload Configuration
  maxFileSize: parseInt(import.meta.env.VITE_MAX_FILE_SIZE || '10485760'), // 10MB
  maxFiles: parseInt(import.meta.env.VITE_MAX_FILES || '6'),
  allowedFileTypes: ['application/pdf'],
  
  // UI Configuration
  uploadTimeout: parseInt(import.meta.env.VITE_UPLOAD_TIMEOUT || '300000'), // 5 minutes
  
  // Development
  isDevelopment: import.meta.env.DEV,
} as const;

// Helper function to format file size
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Helper function to validate file
export const validateFile = (file: File): { valid: boolean; error?: string } => {
  // Check file type
  if (!config.allowedFileTypes.includes(file.type as 'application/pdf')) {
    return {
      valid: false,
      error: `Invalid file type. Only PDF files are allowed.`
    };
  }
  
  // Check file size
  if (file.size > config.maxFileSize) {
    return {
      valid: false,
      error: `File size exceeds ${formatFileSize(config.maxFileSize)} limit.`
    };
  }
  
  return { valid: true };
};
