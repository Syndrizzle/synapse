import { Hand } from "lucide-react";

export const Ratelimited = () => {
  return (
    <div className="bg-neutral-900 min-h-screen flex flex-col items-center justify-center p-6 gap-4">
      <header className="fixed top-0 left-0 right-0  flex items-center z-50 w-full justify-center mt-10">
        <img
          src="/logo.svg"
          alt="Synapse Logo"
          className="md:h-10 h-8 w-auto object-cover"
        />
      </header>
      <Hand strokeWidth={1} className="text-neutral-50 md:w-32 w-28 h-32" />
      <div className="flex flex-col items-center justify-center gap-4">
        <p className="font-heading md:text-6xl text-5xl text-neutral-50 text-center">
          Hold Up, Speedster!
        </p>
        <p className="text-neutral-300 font-body md:text-xl max-w-3xl text-center flex-col flex">
          You're absolutely crushing it with the quiz-making. Our servers are
          just taking a quick breather to keep up with your pace. Looks like
          you've hit our temporary cooldown. Give it a minute, maybe grab a
          snack, and your next academic glow-up will be ready in no time.
        </p>
      </div>
    </div>
  );
};
