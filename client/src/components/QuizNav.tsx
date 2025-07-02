import { useState, useRef, useEffect } from "react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { Button } from "@/components//Button";
import { Cross as Hamburger } from "hamburger-react";
import { AnimatePresence, motion } from "motion/react";
import { type QuizNavProps } from "@/types/quiz";

export const QuizNav = ({ currentQuestionIndex, answers, visited, onGoToQuestion }: QuizNavProps) => {
  const isMobile = useIsMobile();
  const [isOpen, setOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const mobileScrollRef = useRef<HTMLDivElement>(null);
  const [scrollShadows, setScrollShadows] = useState({
    top: false,
    bottom: false,
  });
  const [mobileScrollShadows, setMobileScrollShadows] = useState({
    top: false,
    bottom: false,
  });

  const updateScrollShadows = () => {
    if (!scrollRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const canScrollUp = scrollTop > 0;
    const canScrollDown = scrollTop < scrollHeight - clientHeight - 1;

    setScrollShadows({
      top: canScrollUp,
      bottom: canScrollDown,
    });
  };

  const updateMobileScrollShadows = () => {
    if (!mobileScrollRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = mobileScrollRef.current;
    const canScrollUp = scrollTop > 0;
    const canScrollDown = scrollTop < scrollHeight - clientHeight - 1;

    setMobileScrollShadows({
      top: canScrollUp,
      bottom: canScrollDown,
    });
  };

  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (!scrollElement) return;

    // Initial check
    updateScrollShadows();

    // Add scroll listener
    scrollElement.addEventListener('scroll', updateScrollShadows);
    
    // Add resize listener to handle dynamic content changes
    const resizeObserver = new ResizeObserver(updateScrollShadows);
    resizeObserver.observe(scrollElement);

    return () => {
      scrollElement.removeEventListener('scroll', updateScrollShadows);
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    const mobileScrollElement = mobileScrollRef.current;
    if (!mobileScrollElement || !isOpen) return;

    // Initial check
    updateMobileScrollShadows();

    // Add scroll listener
    mobileScrollElement.addEventListener('scroll', updateMobileScrollShadows);
    
    // Add resize listener to handle dynamic content changes
    const resizeObserver = new ResizeObserver(updateMobileScrollShadows);
    resizeObserver.observe(mobileScrollElement);

    return () => {
      mobileScrollElement.removeEventListener('scroll', updateMobileScrollShadows);
      resizeObserver.disconnect();
    };
  }, [isOpen]);

  // Disable body scroll when mobile sheet is open
  useEffect(() => {
    if (isMobile) {
      if (isOpen) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, isMobile]);

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
              <div className="w-full px-5 relative" onClick={(e) => e.stopPropagation()}>
                {/* Top scroll shadow */}
                <div 
                  className={`absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-neutral-900 to-transparent pointer-events-none z-10 transition-opacity duration-300 ${
                    mobileScrollShadows.top ? 'opacity-100' : 'opacity-0'
                  }`}
                />
                
                {/* Scrollable content */}
                <div 
                  ref={mobileScrollRef}
                  className="grid grid-cols-4 items-center justify-center gap-2 overflow-y-scroll max-h-72"
                >
                  {navButtons}
                </div>
                
                {/* Bottom scroll shadow */}
                <div 
                  className={`absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-neutral-900 to-transparent pointer-events-none z-10 transition-opacity duration-300 ${
                    mobileScrollShadows.bottom ? 'opacity-100' : 'opacity-0'
                  }`}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  return (
    <div className="relative">
      {/* Top scroll shadow */}
      <div 
        className={`absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-neutral-900 to-transparent pointer-events-none z-10 transition-opacity duration-300 ${
          scrollShadows.top ? 'opacity-100' : 'opacity-0'
        }`}
      />
      
      {/* Scrollable content */}
      <div 
        ref={scrollRef}
        className="grid lg:grid-cols-4 md:grid-cols-3 items-center justify-center gap-2 max-h-72 overflow-y-scroll overflow-x-hidden"
      >
        {navButtons}
      </div>
      
      {/* Bottom scroll shadow */}
      <div 
        className={`absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-neutral-900 to-transparent pointer-events-none z-10 transition-opacity duration-300 ${
          scrollShadows.bottom ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
};
