import { useState } from "react";
import { useIsMobile } from "../hooks/useIsMobile";
import { Button } from "./Button";
import { Cross as Hamburger } from "hamburger-react";
import { AnimatePresence, motion } from "motion/react";
import { type QuizNavProps } from "../types/quiz";

export const QuizNav = ({ currentQuestionIndex, answers, visited, onGoToQuestion }: QuizNavProps) => {
  const isMobile = useIsMobile();
  const [isOpen, setOpen] = useState(false);

  const getButtonVariant = (index: number) => {
    if (currentQuestionIndex === index) {
      return "default"; // Current question
    }
    if (answers[index] !== null) {
      return "default"; // Answered question
    }
    if (visited[index]) {
      return "outlineyellow"; // Visited but unanswered
    }
    return "outline"; // Not visited
  };

  const navButtons = Array.from({ length: answers.length }, (_, i) => (
    <Button
      key={i}
      className="flex items-center justify-center"
      variant={getButtonVariant(i)}
      onClick={() => {
        onGoToQuestion(i);
        if (isMobile) setOpen(false);
      }}
    >
      {i + 1}.
    </Button>
  ));

  if (isMobile) {
    return (
      <>
        <Button
          className={`${
            isOpen ? "bg-yellow-400" : "bg-yellow-300"
          } w-auto px-0 py-0` }
        >
          <Hamburger toggled={isOpen} toggle={setOpen} size={24} />
        </Button>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-neutral-900/95 z-40 flex items-end justify-center mb-21"
              onClick={() => setOpen(false)}
            >
              <div className="w-full px-5" onClick={(e) => e.stopPropagation()}>
                <div className="grid grid-cols-4 items-center justify-center gap-2">
                  {navButtons}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  return (
    <div className="grid lg:grid-cols-4 md:grid-cols-3 items-center justify-center gap-2">
      {navButtons}
    </div>
  );
};
