import axios from "axios";
import { config } from "../config/env";
import { useFileStore } from "../stores/fileStore";

const api = axios.create({
  baseURL: config.apiBaseUrl,
});

export const generateQuiz = async (
  files: { file: File }[],
  onUploadProgress: (progress: number) => void
) => {
  const formData = new FormData();
  files.forEach((fileData) => {
    formData.append("pdfs", fileData.file);
  });

  const response = await api.post("/api/quiz/generate", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    onUploadProgress: (progressEvent) => {
      const { loaded, total } = progressEvent;
      if (total) {
        const percentage = Math.round((loaded * 100) / total);
        onUploadProgress(percentage);
      }
    },
  });

  if (response.status === 202 && response.data.data.quizId) {
    useFileStore.getState().setQuizId(response.data.data.quizId);
    return response.data.data.quizId;
  } else {
    throw new Error("Failed to start quiz generation.");
  }
};

export const checkQuizStatus = async (quizId: string) => {
  const response = await api.get(`/api/quiz/processing/${quizId}`);
  return response.data.data.status;
};

export const getQuiz = async (quizId: string) => {
  const response = await api.get(`/api/quiz/${quizId}`);
  return response.data;
};

export const checkApiHealth = async () => {
  const response = await api.get("/health");
  // If the backend sends capacity, update the store so the whole app reacts
  if (response.data && response.data.capacity) {
    const { maxFiles, maxFileSize, allowedFileTypes } = response.data.capacity;
    useFileStore.getState().setUploadConfig({ maxFiles, maxFileSize, allowedFileTypes });
  }
  return response.data;
};
