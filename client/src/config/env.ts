/**
 * Environment configuration for Synapse frontend
 */

export const config = {
  // Upload Configuration
  allowedFileTypes: ["application/pdf"],

  // UI Configuration
  uploadTimeout: parseInt(import.meta.env.VITE_UPLOAD_TIMEOUT || "300000"), // 5 minutes

  // Development
  isDevelopment: import.meta.env.DEV,
} as const;