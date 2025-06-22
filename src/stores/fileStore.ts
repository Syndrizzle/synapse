import { create } from "zustand";
import { config } from "../config/env";

export interface FileData {
  id: string;
  file: File;
  thumbnail: string;
}

interface FileState {
  files: FileData[];
  quizId: string | null;
  uploadSpeed: number; // in KB/s
  processingStatus: string | null;
  addFiles: (files: FileData[]) => void;
  removeFile: (id: string) => void;
  clearFiles: () => void;
  setQuizId: (quizId: string | null) => void;
  setUploadSpeed: (speed: number) => void;
  setProcessingStatus: (status: string | null) => void;
}

export const useFileStore = create<FileState>((set) => ({
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
        files: uniqueFiles.slice(0, config.maxFiles),
      };
    }),
  removeFile: (id) =>
    set((state) => ({
      files: state.files.filter((file) => file.id !== id),
    })),
  clearFiles: () => set({ files: [], quizId: null, uploadSpeed: 0, processingStatus: null }),
  setQuizId: (quizId) => set({ quizId }),
  setUploadSpeed: (speed) => set({ uploadSpeed: speed }),
  setProcessingStatus: (status) => set({ processingStatus: status }),
}));
