import { useEffect, useRef } from "react";
import LottieAnimation from "@/components/LottieAnimation";
import AnalyzingLottie from "@/animations/analyze.json";
import { useFileStore } from "@/stores/fileStore";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { checkQuizStatus } from "@/services/api";
import useRotatingMotd from "@/hooks/useRotatingMotd";

export const Analyzing = () => {
  const { quizId, setProcessingStatus } = useFileStore();
  const navigate = useNavigate();
  const toastShownRef = useRef(false);
  const currentMotd = useRotatingMotd();

  useEffect(() => {
    if (!quizId) {
      if (!toastShownRef.current) {
        toast.error("No active quiz found.");
        toastShownRef.current = true;
      }
      navigate("/");
      return;
    }

    const interval = setInterval(async () => {
      try {
        const status = await checkQuizStatus(quizId);
        setProcessingStatus(status);

        if (status === "completed") {
          clearInterval(interval);
          toast.success("Quiz generated successfully!");
          navigate(`/quiz/${quizId}/onboarding`);
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
    <div className="bg-neutral-900 min-h-screen flex flex-col items-center justify-center p-6 gap-4">
      <header className="fixed top-0 left-0 right-0  flex items-center z-50 w-full justify-center mt-10">
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
        <p className="font-heading md:text-6xl text-4xl text-neutral-50 text-center">
          {currentMotd}
        </p>
        <p className="text-neutral-300 font-body md:text-xl max-w-3xl text-center flex-col flex">
          Your files have been uploaded and are being analyzed. This may take a
          few moments depending on the size and number of files.
        </p>
      </div>
    </div>
  );
};
