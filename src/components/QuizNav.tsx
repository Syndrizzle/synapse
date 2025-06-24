import { useState } from "react";
import { useIsMobile } from "../hooks/useIsMobile";
import { Button } from "./Button";
import { Cross as Hamburger } from "hamburger-react";
import { AnimatePresence, motion } from "motion/react";

export const QuizNav = () => {
  const isMobile = useIsMobile();
  const [isOpen, setOpen] = useState(false);

  if (isMobile) {
    return (
      <>
        <div
          className={`${
            isOpen ? "bg-yellow-400" : "bg-yellow-300"
          } border-2 border-neutral-900`}
        >
          <Hamburger size={24} toggled={isOpen} toggle={setOpen} />
        </div>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              className="fixed inset-0 bg-neutral-900/95 z-40 flex items-end justify-center mb-21"
              onClick={() => setOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="w-full px-5" onClick={(e) => e.stopPropagation()}>
                <div className="grid grid-cols-4 items-center justify-center gap-2">
                  <Button
                    className="flex items-center justify-center"
                    size={"lg"}
                  >
                    1.
                  </Button>
                  <Button
                    className="flex items-center justify-center"
                    size={"lg"}
                    variant={"outline"}
                  >
                    2.
                  </Button>
                  <Button
                    className="flex items-center justify-center"
                    size={"lg"}
                    variant={"outlineyellow"}
                  >
                    3.
                  </Button>
                  <Button
                    className="flex items-center justify-center"
                    size={"lg"}
                    variant={"outline"}
                  >
                    4.
                  </Button>
                  <Button
                    className="flex items-center justify-center"
                    size={"lg"}
                    variant={"outline"}
                  >
                    5.
                  </Button>
                  <Button
                    className="flex items-center justify-center"
                    size={"lg"}
                    variant={"outline"}
                  >
                    6.
                  </Button>
                  <Button
                    className="flex items-center justify-center"
                    size={"lg"}
                    variant={"outlineyellow"}
                  >
                    7.
                  </Button>
                  <Button
                    className="flex items-center justify-center"
                    size={"lg"}
                    variant={"outline"}
                  >
                    8.
                  </Button>
                  <Button
                    className="flex items-center justify-center"
                    size={"lg"}
                    variant={"outline"}
                  >
                    9.
                  </Button>
                  <Button
                    className="flex items-center justify-center"
                    size={"lg"}
                    variant={"outline"}
                  >
                    10.
                  </Button>
                  <Button
                    className="flex items-center justify-center"
                    size={"lg"}
                    variant={"outline"}
                  >
                    11.
                  </Button>
                  <Button
                    className="flex items-center justify-center"
                    size={"lg"}
                    variant={"outline"}
                  >
                    12.
                  </Button>
                  <Button
                    className="flex items-center justify-center"
                    size={"lg"}
                    variant={"outlineyellow"}
                  >
                    13.
                  </Button>
                  <Button
                    className="flex items-center justify-center"
                    size={"lg"}
                    variant={"outline"}
                  >
                    14.
                  </Button>
                  <Button
                    className="flex items-center justify-center"
                    size={"lg"}
                    variant={"outline"}
                  >
                    15.
                  </Button>
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
      <Button className="flex items-center justify-center" size={"lg"}>
        1.
      </Button>
      <Button
        className="flex items-center justify-center"
        size={"lg"}
        variant={"outline"}
      >
        2.
      </Button>
      <Button
        className="flex items-center justify-center"
        size={"lg"}
        variant={"outlineyellow"}
      >
        3.
      </Button>
      <Button
        className="flex items-center justify-center"
        size={"lg"}
        variant={"outline"}
      >
        4.
      </Button>
      <Button
        className="flex items-center justify-center"
        size={"lg"}
        variant={"outline"}
      >
        5.
      </Button>
      <Button
        className="flex items-center justify-center"
        size={"lg"}
        variant={"outline"}
      >
        6.
      </Button>
      <Button
        className="flex items-center justify-center"
        size={"lg"}
        variant={"outlineyellow"}
      >
        7.
      </Button>
      <Button
        className="flex items-center justify-center"
        size={"lg"}
        variant={"outline"}
      >
        8.
      </Button>
      <Button
        className="flex items-center justify-center"
        size={"lg"}
        variant={"outline"}
      >
        9.
      </Button>
      <Button
        className="flex items-center justify-center"
        size={"lg"}
        variant={"outline"}
      >
        10.
      </Button>
      <Button
        className="flex items-center justify-center"
        size={"lg"}
        variant={"outline"}
      >
        11.
      </Button>
      <Button
        className="flex items-center justify-center"
        size={"lg"}
        variant={"outline"}
      >
        12.
      </Button>
      <Button
        className="flex items-center justify-center"
        size={"lg"}
        variant={"outlineyellow"}
      >
        13.
      </Button>
      <Button
        className="flex items-center justify-center"
        size={"lg"}
        variant={"outline"}
      >
        14.
      </Button>
      <Button
        className="flex items-center justify-center"
        size={"lg"}
        variant={"outline"}
      >
        15.
      </Button>
    </div>
  );
};
