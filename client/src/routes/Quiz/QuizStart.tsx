import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import LottieAnimation from "@/components/LottieAnimation";
import SuccessLottie from "@/animations/success.json";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/Button";
import { getQuiz, getQuizResults } from "@/services/api";
import { useFileStore } from "@/stores/fileStore";
import toast from "react-hot-toast";
import { type QuizData } from "@/types/quiz";
import { Loading } from "@/components/Loading";

export const QuizStart = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { setQuizId, clearFiles } = useFileStore();

  useEffect(() => {
    if (quizId) {
      setQuizId(quizId);
      const fetchQuizData = async () => {
        try {
          const response = await getQuiz(quizId);
          if (response.success) {
            setQuizData(response.data);
          } else {
            setError(response.message || "Failed to load quiz data.");
          }
        } catch {
          setError("An error occurred while fetching quiz data.");
        } finally {
          setLoading(false);
        }
      };

      fetchQuizData();
    }
  }, [quizId, setQuizId]);

  if (loading) {
    return (
      <Loading />
    );
  }

  if (error) {
    toast.error("Failed to retrieve quiz data.");
    navigate("/error");
  }

  if (!quizData) {
    return null;
  }

  return (
    <div className="bg-neutral-900 min-h-screen lg:max-w-6xl mx-auto flex flex-col items-center justify-start md:p-8 gap-4 p-4">
      <a href="/">
        <header className="flex items-center w-full justify-center mt-4 md:mt-0">
          <img
            src="/logo.svg"
            alt="Synapse Logo"
            className="md:h-10 h-8 w-auto object-cover m-2"
          />
        </header>
      </a>
      <div className="flex md:flex-row flex-col gap-4 text-clip">
        <div className="w-full bg-neutral-800 md:px-8 px-6 py-4 rounded-lg flex flex-col justify-center gap-3">
          <div className="font-heading md:text-5xl text-4xl text-green-500 md:my-4 my-2 flex items-center md:gap-4 gap-3">
            <LottieAnimation
              animationData={SuccessLottie}
              className="md:w-12 w-8"
            />
            Quiz Generated!
          </div>
          <p className="font-body text-neutral-200 md:text-xl">
            {quizData.description}
          </p>
          <p className="font-body text-neutral-400 md:text-base text-sm">
            Quiz ID: {quizData.id}
          </p>
        </div>
        <div className="bg-neutral-800 md:px-8 py-4 rounded-lg flex md:flex-col flex-row justify-around md:w-1/4 gap-3">
          <div className="flex flex-col gap-1">
            <div className="font-body text-neutral-50 flex flex-row md:gap-2 gap-1 items-center">
              Est. Duration
              <ArrowRight className="md:w-5 md:h-5 w-4 h-4" />
            </div>
            <p className="font-heading lg:text-4xl text-3xl text-neutral-200">
              {quizData.metadata.estimatedDuration} Minutes
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <div className="font-body text-neutral-50 flex flex-row md:gap-2 gap-1 items-center">
              No. of Questions
              <ArrowRight className="md:w-5 md:h-5 w-4 h-4" />
            </div>
            <p className="font-heading lg:text-4xl text-3xl text-neutral-200">
              {quizData.metadata.totalQuestions} Questions
            </p>
          </div>
        </div>
      </div>
      <div className="flex md:flex-row flex-col w-full gap-4 text-clip">
        <div className="w-full bg-neutral-800 md:px-8 px-5 py-4 rounded-lg flex flex-col justify-center gap-3">
          <div className="font-body text-neutral-200 md:text-xl flex flex-row md:gap-2 gap-1 items-center">
            Topics Covered
            <ArrowRight className="md:w-5 md:h-5 w-4 h-4" />
          </div>
          <div className="flex flex-wrap gap-2 md:text-base text-sm">
            {quizData.metadata.topics.map((topic, index) => (
              <p
                key={index}
                className="bg-neutral-700 py-1 px-3 rounded-lg font-body text-neutral-400"
              >
                {topic}
              </p>
            ))}
          </div>
        </div>
      </div>
      <div className="flex md:flex-row flex-col items-center justify-center md:gap-4 gap-2 w-full md:w-2/3 lg:w-1/2">
        <Button
          variant="destructive"
          onClick={() => {
            clearFiles();
            navigate("/");
          }}
        >
          <ArrowLeft className="w-6 h-6" strokeWidth={1.5} />
          Back
        </Button>
        <Button
          holdToConfirm
          onHoldComplete={async () => {
            if (!quizId) return;

            const resultsResponse = await getQuizResults(quizId);
            if (resultsResponse.data.found) {
              // Quiz already submitted, redirect to already submitted page
              navigate(`/quiz/${quizId}/already-submitted`);
              return;
            }

            // Quiz not submitted, start the quiz
            navigate(`/quiz/${quizId}`);
          }}
        >
          <ArrowRight className="w-6 h-6" strokeWidth={1.5} />
          Hold to Start
        </Button>
      </div>
    </div>
  );
};
