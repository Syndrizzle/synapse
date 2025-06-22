import { create } from "zustand";
import { config } from "../config/env";

export interface FileData {
  id: string;
  file: File;
  thumbnail: string;
}

interface FileState {
  files: FileData[];
  addFiles: (files: FileData[]) => void;
  removeFile: (id: string) => void;
  clearFiles: () => void;
}

export const useFileStore = create<FileState>((set) => ({
  files: [],
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
  clearFiles: () => set({ files: [] }),
}));
