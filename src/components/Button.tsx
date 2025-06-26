import { motion, AnimatePresence } from "motion/react";
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../lib/utils";

const buttonVariants = cva(
  "flex items-center justify-between gap-2 font-bold font-body transition-all disabled:pointer-events-none disabled:opacity-50 outline-none w-full cursor-pointer duration-300 rounded-none hover:rounded-[12px]",
  {
    variants: {
      variant: {
        default:
          "bg-yellow-300 hover:bg-yellow-400 text-neutral-900 border-2 border-yellow-400 inset-shadow-sm inset-shadow-yellow-700",
        destructive:
          "bg-[#fa8b8b] text-neutral-900 border-2 border-red-500 hover:bg-red-400 inset-shadow-sm inset-shadow-red-800",
        outlineyellow:
          "bg-neutral-800 text-yellow-500 border-2 border-yellow-500",
        outline:
          "bg-neutral-800 text-neutral-50 border-2 border-neutral-500 hover:border-yellow-400",
      },
      size: {
        default: "lg:px-6 px-4 lg:py-3 py-2",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

interface ButtonProps
    extends React.ComponentProps<"button">,
        VariantProps<typeof buttonVariants> {
    asChild?: boolean;
    holdToConfirm?: boolean;
    onHoldComplete?: () => void;
}

function Button({
    className,
    variant,
    size,
    asChild = false,
    holdToConfirm = false,
    onHoldComplete,
    ...props
}: ButtonProps) {
    const Comp = asChild ? Slot : "button";
    const [isHolding, setIsHolding] = React.useState(false);
    const [progress, setProgress] = React.useState(0);
    const intervalRef = React.useRef<number | null>(null);
    const timeoutRef = React.useRef<number | null>(null);

    const handleMouseDown = () => {
        if (!holdToConfirm) return;

        setIsHolding(true);
        intervalRef.current = window.setInterval(() => {
            setProgress((prev) => Math.min(prev + 10, 100));
        }, 100);

        timeoutRef.current = window.setTimeout(() => {
            if (onHoldComplete) {
                onHoldComplete();
            }
            reset();
        }, 2000);
    };

    const handleMouseUp = () => {
        if (!holdToConfirm) return;
        reset();
    };

    const handleMouseLeave = () => {
        if (!holdToConfirm) return;
        reset();
    };

    const reset = () => {
        setIsHolding(false);
        setProgress(0);
        if (intervalRef.current) {
            window.clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        if (timeoutRef.current) {
            window.clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    };

    const progressStyle = {
        width: `${progress}%`,
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        height: '100%',
        position: 'absolute' as const,
        left: 0,
        top: 0,
        transition: 'width 0.1s linear, opacity 0.3s ease-in-out',
        opacity: isHolding && progress > 0 ? 1 : 0,
    };

    return (
        <Comp
            data-slot="button"
            className={cn(buttonVariants({ variant, size, className }))}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            {...props}
        >
            {props.children}
            <AnimatePresence>
                {isHolding && (
                    <motion.div
                        style={progressStyle}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                    />
                )}
            </AnimatePresence>
        </Comp>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export { Button, buttonVariants };
