import { CircleDot } from "lucide-react";

export const QuizArea = () => {
  return (
    <div className="md:bg-neutral-800 md:border-2 md:border-neutral-500 w-full h-full gap-6 md:p-4 md:shadow-2xl md:shadow-neutral-950/60 transition-colors duration-300 flex flex-col justify-center items-center shadow-none">
      <div className="flex flex-col w-full max-w-3xl gap-4">
        <p className="font-heading text-4xl text-neutral-50">Question 1.</p>
        <p className="bg-neutral-700 rounded-lg px-3 py-1 font-body text-neutral-400 self-start">
          Topic: Operating System Functions
        </p>
      </div>
      <div className="w-full max-w-3xl flex flex-col gap-6">
        <p className="font-body text-neutral-50 text-2xl">
          Which core function of an operating system is responsible for
          scheduling, communication, and deadlock handling for programs that are
          currently running?
        </p>
        <div className="lg:grid lg:grid-cols-2 lg:grid-rows-2 flex flex-col gap-4">
          <div className="bg-yellow-400 font-body text-neutral-900 border-2 border-neutral-950 flex flex-row items-center justify-end px-6 py-3 md:text-2xl text-lg relative cursor-pointer hover:bg-yellow-500 transition-all duration-300">
            <CircleDot className="absolute left-3" />
            Process management
          </div>
          <div className="bg-neutral-900 font-body text-neutral-50 border-2 border-neutral-500 flex flex-row items-center justify-end px-6 py-3 md:text-2xl text-lg relative cursor-pointer hover:border-yellow-400 transition-all duration-300 hover:text-yellow-400">
            <CircleDot className="absolute left-3" />
            File management
          </div>
          <div className="col-start-1 row-start-2 bg-neutral-900 font-body text-neutral-50 border-2 border-neutral-500 flex flex-row items-center justify-end px-6 py-3 md:text-2xl text-lg relative cursor-pointer hover:border-yellow-400 transition-all duration-300 hover:text-yellow-400">
            <CircleDot className="absolute left-3" />
            Device management
          </div>
          <div className="col-start-2 row-start-2 bg-neutral-900 font-body text-neutral-50 border-2 border-neutral-500 flex flex-row items-center justify-end px-6 py-3 md:text-2xl text-lg relative cursor-pointer hover:border-yellow-400 transition-all duration-300 hover:text-yellow-400">
            <CircleDot className="absolute left-3" />
            Memory management
          </div>
        </div>
      </div>
    </div>
  );
};
