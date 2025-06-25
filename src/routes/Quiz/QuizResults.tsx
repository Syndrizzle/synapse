import LottieAnimation from "../../components/LottieAnimation";
import ResultLottie from "../../animations/result.json";
import { ArrowRight, BadgeCheck, FileText, Star } from "lucide-react";
import { motion } from "motion/react";
import { ResultsNav } from "../../components/ResultsNav";
import { Button } from "../../components/Button";
export const QuizResults = () => {
  return (
    <div className="bg-neutral-900 min-h-screen flex flex-col items-center justify-start md:p-8 gap-4 p-4 lg:max-w-5xl mx-auto">
      <header className="flex items-center w-full justify-center">
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
            <span className="text-green-500">11</span> / 15 Questions
          </p>
        </div>
        <div className="bg-neutral-800 md:col-span-2 md:col-start-4 col-span-3 rounded-lg flex flex-col p-6 gap-2 justify-center">
          <div className="text-center text-neutral-200 font-body lg:text-xl text-lg">
            Grade
          </div>
          <motion.p
            initial={{ opacity: 0, scale: 3 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="text-green-500 font-body font-black lg:text-7xl text-5xl text-center"
          >
            A
          </motion.p>
        </div>
        <div className="bg-neutral-800 rounded-lg flex flex-row lg:px-8 px-6 py-4 gap-2 justify-between items-center md:col-span-4 row-start-2 md:row-start-1 col-span-9 md:col-start-6">
          <div className="flex flex-col lg:gap-4 gap-2">
            <div className="font-body text-neutral-50 flex flex-row md:gap-2 gap-1 items-center">
              Time Taken
              <ArrowRight className="md:w-5 md:h-5 w-4 h-4" />
            </div>
            <p className="font-heading lg:text-5xl text-3xl text-neutral-200">
              09:50 Mins
            </p>
          </div>
          <div className="flex flex-col lg:gap-4 gap-2">
            <div className="font-body text-neutral-50 flex flex-row md:gap-2 gap-1 items-center">
              Percentage
              <ArrowRight className="md:w-5 md:h-5 w-4 h-4" />
            </div>
            <p className="font-heading lg:text-5xl text-3xl text-green-500">
              73%
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
          <Button size={"lg"}>
            <FileText />
            <p className="text-lg">Generate PDF</p>
          </Button>
        </div>
        <div className="w-full flex bg-neutral-800 rounded-lg md:col-span-5 md:row-start-2 md:col-start-5 row-start-4 col-span-9 items-center justify-center p-6 flex-col lg:gap-4 gap-3">
          <div className="lg:text-3xl text-2xl text-neutral-50 font-heading flex flex-row items-center gap-2">
            Check Individual Questions
          </div>
          <ResultsNav />
        </div>
      </div>
      <div className="flex flex-col gap-2 items-start w-full justify-center py-6 lg:px-0 px-2">
        <div className="lg:text-4xl text-3xl font-heading text-neutral-50 flex md:flex-row flex-col gap-4 md:items-center w-full">
          Question 1.
          <p className="text-sm bg-neutral-700 self-start md:self-center rounded-lg px-3 py-1 font-body text-neutral-400">
            Topic: Operating System Functions
          </p>
        </div>
        <div className="bg-neutral-800 h-0.5 w-full my-4" />
        <div className="w-full flex flex-col gap-6">
          <p className="font-body text-neutral-50 text-2xl">
            Which core function of an operating system is responsible for
            scheduling, communication, and deadlock handling for programs that
            are currently running?
          </p>
          <div className="lg:grid lg:grid-cols-2 lg:grid-rows-2 flex flex-col gap-4">
            <div className="font-body border-2 flex flex-row items-center justify-center px-6 py-3 md:text-2xl text-lg relative cursor-pointer transition-all duration-300 gap-4 bg-green-400 text-neutral-900 border-green-600">
              Process management
            </div>
            <div className="font-body border-2 flex flex-row items-center justify-center px-6 py-3 md:text-2xl text-lg relative cursor-pointer transition-all duration-300 gap-4 bg-neutral-900 text-neutral-50 border-neutral-500 ">
              File management
            </div>
            <div className="col-start-1 row-start-2 font-body border-2 flex flex-row items-center justify-center px-6 py-3 md:text-2xl text-lg relative cursor-pointer transition-all duration-300 gap-4 bg-neutral-900 text-neutral-50 border-neutral-500 ">
              Device management
            </div>
            <div className="col-start-2 row-start-2 font-body border-2 flex flex-row items-center justify-center px-6 py-3 md:text-2xl text-lg relative cursor-pointer transition-all duration-300 gap-4 bg-neutral-900 text-neutral-50 border-neutral-500 ">
              Memory management
            </div>
          </div>
          <div className="bg-neutral-800 h-0.5 w-full my-2" />
          <div className="gap-2 flex flex-row font-body items-center">
            <p className="text-neutral-300">Your Answer:</p>
            <div className="px-3 py-1 bg-green-400/10 text-green-400 rounded-lg">
              Correct
            </div>
          </div>
          <div className="flex flex-col gap-2 bg-green-400/10 rounded-lg p-6">
            <div className="flex flex-col gap-2 justify-center">
              <p className="text-green-400 font-body lg:text-lg flex items-center gap-2">
                <BadgeCheck className="w-5 h-5" />
                Explanation
              </p>
              <p className="font-body text-neutral-50 lg:text-xl">
                Process management involves scheduling, communication, and
                deadlock handling for programs in execution.
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-1 font-body text-center">
        <p className="text-neutral-200">Submitted On: 25 Jun 2025, 10:41 AM</p>
        <p className="text-neutral-400">
          Quiz ID: cdc97f37-c808-4926-93c3-07da967ee16b
        </p>
      </div>
    </div>
  );
};
