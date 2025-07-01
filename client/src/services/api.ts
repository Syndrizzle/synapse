import axios from "axios";
import { useFileStore } from "@/stores/fileStore";

const api = axios.create({
  baseURL: "/api/v1",
});

// Add a response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 429) {
      // Redirect to the rate-limited page
      window.location.href = "/ratelimited";
      // Prevent further error handling in components
      return new Promise(() => {}); 
    }
    return Promise.reject(error);
  }
);

export const generateQuiz = async (
  files: { file: File }[],
  useSearch: boolean,
  onUploadProgress: (progress: number) => void
) => {
  const formData = new FormData();
  files.forEach((fileData) => {
    formData.append("pdfs", fileData.file);
  });
  formData.append("useSearch", String(useSearch));

  const response = await api.post("/quiz/generate", formData, {
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
  const response = await api.get(`/quiz/processing/${quizId}`);
  return response.data.data.status;
};

export const submitQuiz = async (quizId: string, answers: (number | null)[], timeTaken: number) => {
  const response = await api.post(`/quiz/${quizId}/submit`, { answers, timeTaken });
  return response.data;
};

export const getQuiz = async (quizId: string) => {
  const response = await api.get(`/quiz/${quizId}`);
  return response.data;
};

export const getQuizResults = async (quizId: string) => {
  const response = await api.get(`/quiz/${quizId}/results`);
  return response.data;
};

export const checkApiHealth = async () => {
  const response = await api.get("/health");
  // If the backend sends capacity, update the store so the whole app reacts
  if (response.data && response.data.capacity) {
    const { maxFiles, maxFileSize, allowedFileTypes, searchEnabled } = response.data.capacity;
    useFileStore.getState().setUploadConfig({ maxFiles, maxFileSize, allowedFileTypes, searchEnabled });
  }
  return response.data;
};
