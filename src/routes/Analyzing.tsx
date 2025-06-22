import { useEffect } from "react";
import LottieAnimation from "../components/LottieAnimation";
import AnalyzingLottie from "../animations/analyze.json";
import { useFileStore } from "../stores/fileStore";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { config } from "../config/env";
import toast from "react-hot-toast";

export const Analyzing = () => {
  const { quizId, setProcessingStatus } = useFileStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!quizId) {
      toast.error("No active quiz found.");
      navigate("/");
      return;
    }

    const interval = setInterval(async () => {
      try {
        const response = await axios.get(
          `${config.apiBaseUrl}/api/quiz/processing/${quizId}`
        );
        const status = response.data.data.status;
        setProcessingStatus(status);

        if (status === "completed") {
          clearInterval(interval);
          toast.success("Quiz generated successfully!");
          // TODO: Navigate to the quiz page, e.g., /quiz/${quizId}
          console.log("Quiz ready! Navigating next...");
        } else if (status === "failed") {
          clearInterval(interval);
          toast.error("Failed to generate quiz.");
          navigate("/error");
        }
      } catch (error) {
        clearInterval(interval);
        console.error("Polling failed:", error);
        toast.error("An error occurred while checking status.");
        navigate("/error");
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(interval);
  }, [quizId, navigate, setProcessingStatus]);

  return (
    <div className="bg-neutral-900 min-h-screen flex flex-col items-center justify-center p-8 gap-4">
      <header className="fixed top-0 left-0 right-0  flex items-center z-50 w-full justify-center mt-12">
        <img
          src="/logo.svg"
          alt="Synapse Logo"
          className="md:h-10 h-8 w-auto object-cover"
        />
      </header>
      <LottieAnimation
        animationData={AnalyzingLottie}
        className="invert md:w-32 w-28 h-32"
      />
      <div className="flex flex-col items-center justify-center gap-4">
        <p className="font-heading md:text-6xl text-4xl text-neutral-50">
          Analyzing your files...
        </p>
        <p className="text-neutral-300 font-body md:text-xl max-w-3xl text-center flex-col flex">
          Your files have been uploaded and are being analyzed. This may take a
          few moments depending on the size and number of files.
        </p>
      </div>
    </div>
  );
};
