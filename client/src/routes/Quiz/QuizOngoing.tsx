import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft, ArrowRight, Clock } from "lucide-react";
import { QuizArea } from "@/components/QuizArea";
import { QuizNav } from "@/components/QuizNav";
import { useIsMobile } from "@/hooks/useIsMobile";
import { getQuiz, submitQuiz, getQuizResults } from "@/services/api";
import { Button } from "@/components/Button";
import { type QuizData } from "@/types/quiz";
import { Loading } from "@/components/Loading";

export const QuizOngoingPage = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [visited, setVisited] = useState<boolean[]>([]);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!quizId) {
      toast.error("No Quiz ID found!");
      navigate("/");
      return;
    }

    const fetchQuiz = async () => {
      try {
        const resultsResponse = await getQuizResults(quizId);
        if (resultsResponse.data.found) {
          // Quiz already submitted, redirect to already submitted page
          navigate(`/quiz/${quizId}/already-submitted`);
          return;
        }

        const response = await getQuiz(quizId);
        if (response.success) {
          setQuizData(response.data);
          setAnswers(new Array(response.data.questions.length).fill(null));
          const initialVisited = new Array(response.data.questions.length).fill(
            false
          );
          initialVisited[0] = true;
          setVisited(initialVisited);
        } else {
          toast.error(response.message || "Failed to load quiz.");
          navigate("/");
        }
      } catch {
        toast.error("An error occurred while fetching the quiz.");
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [quizId, navigate]);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleGoToQuestion = useCallback((index: number) => {
    setCurrentQuestionIndex(index);
    setVisited((prev) => {
      const newVisited = [...prev];
      newVisited[index] = true;
      return newVisited;
    });
  }, []);

  const handleSelectAnswer = (answerIndex: number) => {
    setAnswers((prev) => {
      const newAnswers = [...prev];
      newAnswers[currentQuestionIndex] = answerIndex;
      return newAnswers;
    });
  };

  const handleNextQuestion = useCallback(() => {
    if (quizData && currentQuestionIndex < quizData.questions.length - 1) {
      handleGoToQuestion(currentQuestionIndex + 1);
    }
  }, [currentQuestionIndex, quizData, handleGoToQuestion]);

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      handleGoToQuestion(currentQuestionIndex - 1);
    }
  };

  const handleFinishQuiz = async () => {
    if (!quizId) return;
    try {
      await submitQuiz(quizId, answers, elapsedTime);
      toast.success("Quiz submitted successfully!");
      navigate(`/quiz/${quizId}/results`);
    } catch {
      toast.error("Failed to submit quiz.");
    }
  };

  if (loading || !quizData) {
    return (
      <Loading />
    );
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const secs = (seconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  };

  const headerContent = (
    <div className="flex flex-col gap-4">
      <a href="/">
        <img
          src="/logo.svg"
          alt="Synapse Logo"
          className="lg:w-2/3 lg:h-12 md:w-full w-1/2"
        />
      </a>
      <div className="flex flex-col gap-2">
        <p className="font-heading lg:text-4xl text-3xl text-green-500 my-2 flex items-center gap-2">
          {quizData.title}
        </p>
        <p className="text-neutral-300 text-lg font-body flex items-center gap-2">
          <Clock size={20} />
          Elapsed Time:
        </p>
        <p className="font-heading lg:text-4xl text-3xl text-neutral-50">
          {formatTime(elapsedTime)} Minutes
        </p>
      </div>
    </div>
  );

  const actionButtons = (
    <div className="flex md:flex-col gap-2 w-full">
      <QuizNav
        currentQuestionIndex={currentQuestionIndex}
        answers={answers}
        visited={visited}
        onGoToQuestion={handleGoToQuestion}
      />
      <div className="flex gap-2 flex-row">
        <Button
          onClick={handlePrevQuestion}
          className={`${currentQuestionIndex === 0
              ? "opacity-50 pointer-events-none"
              : ""
            }`}
        >
          <ArrowLeft />
        </Button>
        <Button
          onClick={handleNextQuestion}
          className={`${currentQuestionIndex === quizData.questions.length - 1
              ? "opacity-50 pointer-events-none cursor-not-allowed"
              : ""
            }`}
        >
          <ArrowRight />
        </Button>
      </div>
      <Button
        holdToConfirm
        onHoldComplete={handleFinishQuiz}
        className="justify-center flex-1 text-sm md:text-lg"
      >
        Hold to Finish
      </Button>
    </div>
  );
  if (isMobile) {
    return (
      <>
        <div className="bg-neutral-900 h-screen flex flex-col px-6 py-10 gap-6">
          {headerContent}
          <div className="pb-28">
            <QuizArea
              key={currentQuestionIndex} // Ensures animation triggers
              question={quizData.questions[currentQuestionIndex]}
              questionIndex={currentQuestionIndex}
              selectedAnswer={answers[currentQuestionIndex]}
              onSelectAnswer={handleSelectAnswer}
            />
          </div>
        </div>
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-neutral-900 border-t border-neutral-800 flex flex-row gap-4">
          {actionButtons}
        </div>
      </>
    );
  }
  return (
    <div className="bg-neutral-900 lg:h-screen min-h-screen lg:p-6 p-4 flex gap-6 ">
      <QuizArea
        key={currentQuestionIndex} // Ensures animation triggers
        question={quizData.questions[currentQuestionIndex]}
        questionIndex={currentQuestionIndex}
        selectedAnswer={answers[currentQuestionIndex]}
        onSelectAnswer={handleSelectAnswer}
      />

      <div className="flex flex-col lg:w-1/3 w-2/5 justify-between">
        <div className="lg:p-4 p-4">{headerContent}</div>
        <div className="flex flex-col gap-4 px-0">{actionButtons}</div>
      </div>
    </div>
  );
};
