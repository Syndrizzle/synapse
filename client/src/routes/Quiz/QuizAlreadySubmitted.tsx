import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowRight, CircleQuestionMark } from "lucide-react";
import CountUp from "react-countup";
import { Button } from "@/components/Button";
import { getQuizResults } from "@/services/api";
import { type QuizResultsData, type QuestionResult } from "@/types/quiz";
import { Loading } from "@/components/Loading";

export const QuizAlreadySubmitted = () => {
    const { quizId } = useParams<{ quizId: string }>();
    const navigate = useNavigate();
    const [resultsData, setResultsData] = useState<QuizResultsData | null>(null);
    const [loading, setLoading] = useState(true);

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
                    // Map the server response to our expected interface
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
                    toast.error("Failed to load results.");
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

    if (loading || !resultsData) {
        return (
            <Loading />
        );
    }

    return (
        <div className="bg-neutral-900 min-h-screen flex flex-col items-center justify-start p-6 gap-4">
            <a href="/">
                <header className="flex items-center z-50 w-full justify-center mt-4 mb-8">
                    <img
                        src="/logo.svg"
                        alt="Synapse Logo"
                        className="md:h-10 h-8 w-auto object-cover"
                    />
                </header>
            </a>
            <CircleQuestionMark
                className="text-neutral-50 md:w-24 w-16 md:h-24 h-16" strokeWidth={1}
            />
            <div className="flex flex-col items-center justify-center gap-4">
                <p className="font-heading md:text-6xl text-4xl text-neutral-50 text-center">
                    Well.. that's awkward
                </p>
                <p className="text-neutral-300 font-body md:text-xl max-w-3xl text-center flex-col flex">
                    This quiz has already been submitted. Below is a summary of the previous submission. You may also review the full result for more details.
                </p>
            </div>
            <div className="grid grid-cols-4 items-center justify-center gap-4 w-full max-w-3xl" >
                <div className="bg-neutral-800 rounded-lg flex flex-col p-6 lg:gap-4 gap-2 justify-center col-span-2">
                    <div className="flex items-center gap-2 text-neutral-200 font-body lg:text-xl text-lg">
                        Correct:
                    </div>
                    <p className="text-neutral-50 font-heading text-5xl">
                        <span className="text-green-500">
                            <CountUp
                                end={resultsData.correctAnswers}
                                duration={1.5}
                                delay={0.5}
                            />
                        </span> / {resultsData.questionResults.length}
                    </p>
                </div>
                <div className="bg-neutral-800 rounded-lg flex flex-col p-6 lg:gap-4 gap-2 justify-center col-span-2 col-start-3">
                    <div className="flex items-center gap-2 text-neutral-200 font-body lg:text-xl text-lg">
                        Percentage:
                    </div>
                    <p className="text-neutral-50 font-heading text-5xl">
                        <span className="text-green-500">
                            <CountUp
                                end={resultsData.percentage}
                                duration={1.5}
                                delay={0.5}
                                suffix="%"
                            />
                        </span>
                    </p>
                </div>
                <div className="col-span-4 row-start-2 flex lg:flex-row flex-col w-full rounded-lg bg-neutral-800 p-6 justify-between items-center gap-4">
                    <p className="font-heading text-neutral-50 text-3xl lg:text-4xl lg:w-1/2 text-center lg:text-left">
                        Interested? Check the full result for more details.
                    </p>
                    <a href={`/quiz/${resultsData.id}/results`} className="w-full lg:w-auto">

                        <Button>
                            <ArrowRight />
                            View Full Result

                        </Button>
                    </a>

                </div>
            </div>
        </div>
    );
};
