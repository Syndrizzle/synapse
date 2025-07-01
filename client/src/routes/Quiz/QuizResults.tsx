import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import CountUp from "react-countup";
import LottieAnimation from "@/components/LottieAnimation";
import ResultLottie from "@/animations/result.json";
import { ArrowRight, BadgeCheck, Star, Download } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ResultsNav } from "@/components/ResultsNav";
import { Button } from "@/components/Button";
import { getQuizResults } from "@/services/api";
import { PDFDownloadLink } from '@react-pdf/renderer';
import { QuizResultsPDF } from '@/components/QuizResultsPDF';
import Confetti from 'react-confetti';

import { type QuizResultsData, type QuestionResult } from "@/types/quiz";
import { Loading } from "@/components/Loading";
export const QuizResults = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const [resultsData, setResultsData] = useState<QuizResultsData | null>(null);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowDimensions, setWindowDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  useEffect(() => {
    if (!quizId) {
      toast.error("No Quiz ID found!");
      navigate("/");
      return;
    }

    const fetchResults = async () => {
      try {
        const response = await getQuizResults(quizId);
        if (response.success) {
          const mappedData = {
            ...response.data,
            id: response.data.id || response.data.quizId || quizId,
            questionResults: response.data.questionResults?.map((result: QuestionResult & { questionId?: string }, index: number) => ({
              ...result,
              id: result.id || result.questionId || `question-${index}`
            })) || []
          };
          setResultsData(mappedData);
        } else {
          toast.error(response.message || "Failed to load results.");
          navigate("/");
        }
      } catch {
        toast.error("An error occurred while fetching the results.");
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [quizId, navigate]);

  useEffect(() => {
    const handleResize = () => {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (resultsData && resultsData.performance === "excellent") {
      const confettiStartTimer = setTimeout(() => {
        setShowConfetti(true);
      }, 1000);

      const confettiStopTimer = setTimeout(() => {
        setShowConfetti(false);
      }, 5000);

      return () => {
        clearTimeout(confettiStartTimer);
        clearTimeout(confettiStopTimer);
      };
    }
  }, [resultsData]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')} Mins`;
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }) + ', ' + date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getGradeLetter = (performance: string) => {
    switch (performance) {
      case 'excellent': return 'A';
      case 'good': return 'B';
      case 'average': return 'C';
      case 'needs_improvement': return 'D';
      default: return 'B';
    }
  };

  const getGradeColor = (performance: string) => {
    switch (performance) {
      case 'excellent': return 'text-green-500';
      case 'good': return 'text-green-500';
      case 'average': return 'text-yellow-500';
      case 'needs_improvement': return 'text-red-500';
      default: return 'text-green-500';
    }
  };

  const downloadLink = useMemo(() => {
    if (!resultsData) return null;
    const pdf = <QuizResultsPDF resultsData={resultsData} />;
    return (
      <PDFDownloadLink
        document={pdf}
        fileName={`quiz-results-${resultsData.id}.pdf`}
      >
        {({ loading }) => (
          <Button disabled={loading}>
            <Download />
            <p className="text-lg">
              {loading ? "Generating PDF..." : "Download PDF"}
            </p>
          </Button>
        )}
      </PDFDownloadLink>
    );
  }, [resultsData]);

  if (loading || !resultsData) {
    return (
      <Loading/>
    );
  }

  const currentQuestion = resultsData.questionResults[selectedQuestionIndex];

  return (
    <div className="bg-neutral-900 min-h-screen flex flex-col items-center justify-start md:p-8 gap-4 p-4 lg:max-w-5xl mx-auto">
      <AnimatePresence>
        {showConfetti && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="fixed inset-0 z-50 pointer-events-none"
          >
            <Confetti
              width={windowDimensions.width}
              height={windowDimensions.height}
              recycle={false}
              numberOfPieces={300}
              gravity={0.3}
              colors={['#22c55e', '#fbbf24', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6']}
            />
          </motion.div>
        )}
      </AnimatePresence>
      <header className="flex items-center w-full justify-center mt-4 md:mt-0">
        <img
          src="/logo.svg"
          alt="Synapse Logo"
          className="md:h-10 h-8 w-auto object-cover m-2"
        />
      </header>
      <div className="font-heading md:text-5xl text-4xl text-green-500 md:my-4 my-2 flex items-center md:gap-4 gap-3">
        <LottieAnimation animationData={ResultLottie} className="md:w-12 w-8" />
        Results
      </div>
      <div className="grid grid-cols-9 gap-4 justify-center">
        <div className="bg-neutral-800 md:col-span-3 col-span-6 rounded-lg flex flex-col p-6 lg:gap-4 gap-2 justify-center">
          <div className="flex items-center gap-2 text-neutral-200 font-body lg:text-xl text-lg">
            Correct <ArrowRight className="lg:w-6 lg:h-6 w-5 h-5" />
          </div>
          <p className="text-neutral-50 font-heading lg:text-5xl text-3xl">
            <span className="text-green-500">
              <CountUp
                end={resultsData.correctAnswers}
                duration={1.5}
                delay={0.5}
              />
            </span>{" "}
            / {resultsData.questionResults.length} Questions
          </p>
        </div>
        <div className="bg-neutral-800 md:col-span-2 md:col-start-4 col-span-3 rounded-lg flex flex-col p-6 gap-2 justify-center">
          <div className="text-center text-neutral-200 font-body lg:text-xl text-lg">
            Grade
          </div>
          <motion.p
            initial={{ opacity: 0, scale: 3 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 1.5 }}
            className={`${getGradeColor(
              resultsData.performance
            )} font-body font-black lg:text-7xl text-5xl text-center`}
          >
            {getGradeLetter(resultsData.performance)}
          </motion.p>
        </div>
        <div className="bg-neutral-800 rounded-lg flex flex-row lg:px-8 px-6 py-4 gap-2 justify-between items-center md:col-span-4 row-start-2 md:row-start-1 col-span-9 md:col-start-6">
          <div className="flex flex-col lg:gap-4 gap-2">
            <div className="font-body text-neutral-50 flex flex-row md:gap-2 gap-1 items-center">
              Time Taken
              <ArrowRight className="md:w-5 md:h-5 w-4 h-4" />
            </div>
            <p className="font-heading lg:text-5xl text-3xl text-neutral-200">
              {formatTime(resultsData.timeTaken)}
            </p>
          </div>
          <div className="flex flex-col lg:gap-4 gap-2">
            <div className="font-body text-neutral-50 flex flex-row md:gap-2 gap-1 items-center">
              Percentage
              <ArrowRight className="md:w-5 md:h-5 w-4 h-4" />
            </div>
            <p className="font-heading lg:text-5xl text-3xl text-green-500">
              <CountUp
                end={resultsData.percentage}
                duration={1.5}
                delay={0.5}
                suffix="%"
              />
            </p>
          </div>
        </div>
        <div className="flex bg-neutral-800 rounded-lg md:col-span-4 md:row-start-2 row-start-3 col-span-9 justify-between p-6 flex-col lg:gap-4 gap-3">
          <div className="text-yellow-400 flex gap-2 font-body font-bold items-center text-lg">
            <Star className="animate-wiggle h-5 w-5 fill-yellow-400" />
            RECOMMENDED
          </div>
          <p className="lg:text-5xl text-4xl text-neutral-50 font-heading">
            Download this Result as a PDF
          </p>
          {downloadLink}
        </div>
        <div className="w-full flex bg-neutral-800 rounded-lg md:col-span-5 md:row-start-2 md:col-start-5 row-start-4 col-span-9 items-center justify-center p-6 flex-col lg:gap-4 gap-3">
          <div className="lg:text-3xl text-2xl text-neutral-50 font-heading flex flex-row items-center gap-2">
            Check Individual Questions
          </div>
          <ResultsNav
            questionResults={resultsData.questionResults}
            selectedQuestionIndex={selectedQuestionIndex}
            onQuestionSelect={setSelectedQuestionIndex}
          />
        </div>
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedQuestionIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col gap-2 items-start w-full justify-center py-6 lg:px-0 px-2"
        >
          <div className="lg:text-4xl text-3xl font-heading text-neutral-50 flex md:flex-row flex-col gap-4 md:items-center w-full">
            Question {selectedQuestionIndex + 1}.
            <p className="text-sm bg-neutral-700 self-start md:self-center rounded-lg px-3 py-1 font-body text-neutral-400">
              Topic: {currentQuestion.topic}
            </p>
          </div>
          <div className="bg-neutral-800 h-0.5 w-full my-4" />
          <div className="w-full flex flex-col gap-4">
            <p className="font-body text-neutral-50 text-2xl">
              {currentQuestion.question}
            </p>
            <div className="lg:grid lg:grid-cols-2 lg:grid-rows-2 flex flex-col gap-4">
              {currentQuestion.options.map((option, index) => {
                const isUserAnswer =
                  currentQuestion.userAnswer !== null &&
                  index === currentQuestion.userAnswer;
                const isCorrectAnswer = index === currentQuestion.correctAnswer;
                const isIncorrectUserAnswer =
                  isUserAnswer && !currentQuestion.isCorrect;

                let className =
                  "font-body border-2 flex flex-row items-center justify-center px-6 py-3 md:text-2xl text-lg relative transition-all duration-300 gap-4 ";

                if (isCorrectAnswer) {
                  className +=
                    "bg-green-400 text-neutral-900 border-green-600 inset-shadow-sm inset-shadow-green-900";
                } else if (isIncorrectUserAnswer) {
                  className +=
                    "bg-red-400 text-neutral-900 border-red-600 inset-shadow-sm inset-shadow-red-900";
                } else {
                  className +=
                    "bg-neutral-900 text-neutral-50 border-neutral-500";
                }

                return (
                  <div key={index} className={className}>
                    {option}
                  </div>
                );
              })}
            </div>
            <div className="bg-neutral-800 h-0.5 w-full my-2" />
            <div className="flex flex-col gap-4">
              <div className="gap-2 flex flex-row font-body items-center">
                <p className="text-neutral-300">Your Answer:</p>
                <div
                  className={`px-3 py-1 rounded-lg ${
                    currentQuestion.userAnswer === null
                      ? "bg-neutral-400/10 text-neutral-400"
                      : currentQuestion.isCorrect
                      ? "bg-green-400/10 text-green-400"
                      : "bg-red-400/10 text-red-400"
                  }`}
                >
                  {currentQuestion.userAnswer === null
                    ? "Not Attempted"
                    : currentQuestion.isCorrect
                    ? "Correct"
                    : "Incorrect"}
                </div>
              </div>
              {(currentQuestion.userAnswer === null ||
                !currentQuestion.isCorrect) && (
                <div className="flex flex-col gap-2 rounded-lg p-4 bg-green-400/10">
                  <div className="flex flex-col gap-2 justify-center">
                    <p className="font-body lg:text-lg flex items-center gap-2 text-green-400">
                      {" "}
                      <BadgeCheck className="w-5 h-5" />
                      Correct Answer:
                    </p>
                    <p className="font-body text-neutral-50 lg:text-xl">
                      {currentQuestion.options[currentQuestion.correctAnswer]}
                    </p>
                  </div>
                </div>
              )}
            </div>
            <div
              className={`flex flex-col gap-2 rounded-lg p-4 ${
                currentQuestion.isCorrect
                  ? "bg-green-400/10"
                  : currentQuestion.userAnswer === null
                  ? "bg-neutral-400/10"
                  : "bg-blue-400/10"
              }`}
            >
              <div className="flex flex-col gap-2 justify-center">
                <p
                  className={`font-body lg:text-lg flex items-center gap-2 ${
                    currentQuestion.isCorrect
                      ? "text-green-400"
                      : currentQuestion.userAnswer === null
                      ? "text-neutral-400"
                      : "text-blue-400"
                  }`}
                >
                  <BadgeCheck className="w-5 h-5" />
                  Explanation
                </p>
                <p className="font-body text-neutral-50 lg:text-xl">
                  {currentQuestion.explanation}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
      <div className="flex flex-col gap-1 font-body text-center">
        <p className="text-neutral-200">
          Submitted On: {formatDate(resultsData.submittedAt)}
        </p>
        <p className="text-neutral-400">Quiz ID: {resultsData.id}</p>
      </div>
    </div>
  );
};
