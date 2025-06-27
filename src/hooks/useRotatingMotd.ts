import { useState, useEffect } from "react";

const motdArray = [
  "Processing thoughts (yours, not ours)",
  "Lowkey cooking up some questions...",
  "Petition to make this PDF a quiz. Signed.",
  "Turning text into test...",
  'Calculating your next "aha!" moment',
  "The brain behind the brain is working...",
  "Is it bussin'? We're finding out.",
  "Currently having a thought... a lot of thoughts, actually.",
  "Your brain cells are getting a glow-up. Period.",
  "Asking the important questions, so you don't have to.",
  "Getting your smarts on. Hold my boba.",
  "Your brain's about to hit different.",
  "Preparing for maximum knowledge retention. It's not a phase, mom.",
  "Your future self (the one who aced the test) says 'thank you'.",
  "Your academic glow-up is brewing. Patience, young padawan.",
];

const useRotatingMotd = (messages = motdArray, intervalTime = 3500) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  useEffect(() => {
    setCurrentMessageIndex(Math.floor(Math.random() * messages.length)); // Start with a random message
    const intervalId = setInterval(() => {
      setCurrentMessageIndex((prevIndex) => (prevIndex + 1) % messages.length);
    }, intervalTime);
    return () => clearInterval(intervalId);
  }, [messages, intervalTime]);
  return messages[currentMessageIndex];
};
export default useRotatingMotd;
