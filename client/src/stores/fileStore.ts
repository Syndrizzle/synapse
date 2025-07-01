import { create } from "zustand";

export interface FileData {
  id: string;
  file: File;
  thumbnail: string;
}

interface FileState {
  // Upload capacity (will be populated from server /health)
  maxFiles: number;
  maxFileSize: number;
  allowedFileTypes: string[];
  searchEnabled: boolean;
  capacityLoaded: boolean;
  files: FileData[];
  quizId: string | null;
  uploadSpeed: number; // in KB/s
  setUploadConfig: (cfg: { maxFiles: number; maxFileSize: number; allowedFileTypes: string[], searchEnabled: boolean }) => void;
  processingStatus: string | null;
  addFiles: (files: FileData[]) => void;
  removeFile: (id: string) => void;
  clearFiles: () => void;
  setQuizId: (quizId: string | null) => void;
  setUploadSpeed: (speed: number) => void;
  setProcessingStatus: (status: string | null) => void;
}

export const useFileStore = create<FileState>((set) => ({
  // Default values will be overridden once /health completes
  maxFiles: 5,
  maxFileSize: 10485760,
  allowedFileTypes: ["application/pdf"],
  searchEnabled: false,
  capacityLoaded: false,
  files: [],
  quizId: null,
  uploadSpeed: 0,
  processingStatus: null,
  addFiles: (newFiles) =>
    set((state) => {
      const combined = [...state.files, ...newFiles];
      const uniqueFiles = Array.from(new Set(combined.map((f) => f.id))).map(
        (id) => {
          return combined.find((f) => f.id === id) as FileData;
        }
      );
      return {
        files: uniqueFiles.slice(0, state.maxFiles),
      } as Partial<FileState>;
    }),
  removeFile: (id: string) =>
    set((state) => ({
      files: state.files.filter((file) => file.id !== id),
    })),
  clearFiles: () => set({ files: [], quizId: null, uploadSpeed: 0, processingStatus: null }),
  setQuizId: (quizId) => set({ quizId }),
  setUploadSpeed: (speed) => set({ uploadSpeed: speed }),
  setProcessingStatus: (status) => set({ processingStatus: status }),
  setUploadConfig: (cfg) => set({ ...cfg, capacityLoaded: true }),
}));
