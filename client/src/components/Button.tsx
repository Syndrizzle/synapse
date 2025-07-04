import { motion, AnimatePresence } from "motion/react";
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  'relative select-none items-center justify-between gap-2 font-body transition-all disabled:pointer-events-none disabled:opacity-50 outline-none w-full cursor-pointer duration-300 text-lg rounded-xl flex bg-size-[80px_80px] text-center  uppercase tracking-wide transition-all duration-200 active:scale-98 ease-button bg-size-[80px_80px] bg-[url(/texture.png)]',
  {
    variants: {
      variant: {
        "default":
          "bg-yellow-400 shadow-button-default active:shadow-button-default-hover text-neutral-950",
        "destructive":
          "bg-[#fa8b8b] text-neutral-950 shadow-button-destructive active:shadow-button-destructive-hover",
        "outline-yellow":
          "bg-neutral-800 text-yellow-600 shadow-button-outline-yellow active:shadow-button-outline-yellow-hover",
        "outline":
          "bg-neutral-800 text-neutral-50 shadow-button-outline active:shadow-button-outline-hover",
      },
      size: {
        default: "lg:px-6 px-4 lg:py-3 py-3",
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
  const [showGlow, setShowGlow] = React.useState(false);
  const intervalRef = React.useRef<number | null>(null);
  const timeoutRef = React.useRef<number | null>(null);
  const glowTimeoutRef = React.useRef<number | null>(null);

  // Vibration API helper function
  const vibrate = (pattern: number | number[]) => {
    if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate(pattern);
      } catch (error) {
        // Silently fail if vibration is not supported or blocked
        console.debug('Vibration not supported or blocked:', error);
      }
    }
  };

  const handlePress = () => {
    if (!holdToConfirm) return;

    setShowGlow(false);
    if (glowTimeoutRef.current) {
      window.clearTimeout(glowTimeoutRef.current);
      glowTimeoutRef.current = null;
    }

    setIsHolding(true);
    
    // Initial vibration when hold starts
    vibrate(50);
    
    intervalRef.current = window.setInterval(() => {
      setProgress((prev) => {
        const newProgress = Math.min(prev + 10, 100);
        
        // Vibrate at 50% progress (halfway)
        if (newProgress === 50) {
          vibrate(30);
        }
        
        if (newProgress === 100) {
          glowTimeoutRef.current = window.setTimeout(() => {
            setShowGlow(true);
          }, 200);
        }
        return newProgress;
      });
    }, 100);

    timeoutRef.current = window.setTimeout(() => {
      // Success vibration pattern when hold completes
      vibrate([100, 50, 100]);
      
      if (onHoldComplete) {
        onHoldComplete();
      }
      reset();
    }, 2000);
  };

  const handleRelease = () => {
    if (!holdToConfirm) return;
    
    // Vibrate briefly if hold was cancelled (not completed)
    if (isHolding && progress < 100) {
      vibrate(25);
    }
    
    reset();
  };

  const handleLeave = () => {
    if (!holdToConfirm) return;
    
    // Vibrate briefly if hold was cancelled (not completed)
    if (isHolding && progress < 100) {
      vibrate(25);
    }
    
    reset();
  };

  const reset = () => {
    setIsHolding(false);
    setProgress(0);
    setShowGlow(false);
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (glowTimeoutRef.current) {
      window.clearTimeout(glowTimeoutRef.current);
      glowTimeoutRef.current = null;
    }
  };

  const progressStyle = {
    width: `${progress}%`,
    background: 'linear-gradient(to right, #00000070, #00000020)',
    height: '100%',
    position: 'absolute' as const,
    left: 0,
    top: 0,
    borderRadius: 'inherit',
    transition: 'width 0.1s linear, opacity 0.3s ease-in-out',
    opacity: isHolding && progress > 0 ? 1 : 0,
  };

  const showProgressBar = isHolding && progress > 0 && !showGlow;

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      onMouseDown={handlePress}
      onMouseUp={handleRelease}
      onMouseLeave={handleLeave}
      onTouchStart={handlePress}
      onTouchEnd={handleRelease}
      onTouchCancel={handleLeave}
      {...props}
    >
      {props.children}
      <AnimatePresence>
        {showProgressBar && (
          <motion.div
            style={progressStyle}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showGlow && isHolding && (
          <motion.div
            className={cn(
              "absolute inset-0 pointer-events-none rounded-xl",
              variant === "destructive" ? "animate-pulse-glow-destructive" : "animate-pulse-glow"
            )}
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
