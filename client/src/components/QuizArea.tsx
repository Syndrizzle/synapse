import { motion, AnimatePresence } from "motion/react";
import { type QuizAreaProps } from "@/types/quiz";

export const QuizArea = ({ question, questionIndex, selectedAnswer, onSelectAnswer }: QuizAreaProps) => {
  return (
    <div className="md:bg-neutral-950 md:border-2 md:border-neutral-500 w-full h-full gap-6 md:p-10 md:shadow-2xl md:shadow-neutral-950/60 flex flex-col justify-center items-center md:bg-[url(/texture-two.png)]">
      <AnimatePresence mode="wait">
        <motion.div
          key={question.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full h-full flex flex-col justify-center items-center gap-6"
        >
          <div className="flex flex-col w-full max-w-3xl gap-4">
            <p className="font-heading text-4xl text-neutral-50">Question {questionIndex + 1}.</p>
            <p className="bg-neutral-700 rounded-lg px-3 py-1 font-body text-neutral-400 self-start">
              Topic: {question.topic}
            </p>
          </div>
          <div className="w-full max-w-3xl flex flex-col gap-6">
            <p className="font-body text-neutral-50 text-2xl">
              {question.question}
            </p>
            <div className="lg:grid lg:grid-cols-2 lg:grid-rows-2 flex flex-col gap-4">
              {question.options.map((option, index) => (
                <div
                  key={index}
                  onClick={() => onSelectAnswer(index)}
                  className={`font-body flex flex-row items-center justify-center px-6 py-3 md:text-2xl text-lg relative cursor-pointer transition-all duration-300 gap-4 rounded-xl active:scale-98 ease-button lg:rounded-2xl bg-size-[80px_80px] bg-[url(/texture.png)] ${
                    selectedAnswer === index
                    ? "bg-yellow-400 shadow-button-default active:shadow-button-default-hover text-neutral-950"
                    : "bg-neutral-800 text-neutral-50 shadow-button-outline active:shadow-button-outline-hover"
                  }`}>
                  {option}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
