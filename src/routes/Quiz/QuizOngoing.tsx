import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { QuizArea } from "../../components/QuizArea";
import { QuizNav } from "../../components/QuizNav";
import { useIsMobile } from "../../hooks/useIsMobile";

export const QuizOngoingPage = () => {
      const isMobile = useIsMobile();
    
    const headerContent = (
      <div className="flex flex-col gap-4">
        <img
          src="/logo.svg"
          alt=" Synapse Logo"
          className="lg:w-2/3 lg:h-12 md:w-full w-1/2"
        />
        <div className="flex flex-col gap-2">
          <p className="font-heading lg:text-4xl text-3xl text-green-500 my-2 flex items-center gap-2">
            Ongoing Quiz
            <ArrowRight className="h-7 w-7"/>
          </p>

          <p className="text-neutral-300 text-lg font-body">Elapsed Time:</p>
          <p className="font-heading lg:text-4xl text-3xl text-neutral-50">
            10:27 Minutes
          </p>
        </div>
      </div>
    );
    const actionButtons = (
      <div className="flex md:flex-col gap-2 w-full">
        <QuizNav />
        <div className="flex gap-2 flex-row">
          <div className="bg-yellow-300 w-full px-3 lg:py-3 py-2 hover:bg-yellow-500 transition-all duration-300 border-2 border-neutral-950 flex items-center justify-center cursor-pointer rounded-none hover:rounded-[50px]">
            <ArrowLeft />
          </div>
          <div className="bg-yellow-300 w-full px-3 lg:py-3 py-2 hover:bg-yellow-500 transition-all duration-300 border-2 border-neutral-950 flex items-center justify-center cursor-pointer rounded-none hover:rounded-[50px]">
            <ArrowRight />
          </div>
        </div>
        <div className="bg-yellow-300 w-full lg:px-6 px-4 lg:py-3 py-2 hover:bg-yellow-500 transition-all duration-300 border-2 border-neutral-950 flex items-center justify-between cursor-pointer rounded-none hover:rounded-[50px] font-body font-bold">
          <Check />
          Finish Quiz
        </div>
      </div>
    );

  if (isMobile) {
    return (
      <>
        <div className="bg-neutral-900 h-screen flex flex-col px-6 py-10 gap-6">
          {headerContent}
          <div className="pb-28">
            <QuizArea />
          </div>
        </div>
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-neutral-900 border-t border-neutral-800 flex flex-row gap-4">
          {actionButtons}
        </div>
      </>
    );
  }

  return (
    <div className="bg-neutral-900 h-screen lg:p-6 p-4 flex gap-6">
      <QuizArea />
      <div className="flex flex-col lg:w-1/3 w-2/5 justify-between">
        <div className="lg:p-4 p-4">{headerContent}</div>
        <div className="flex flex-col gap-4 px-2">{actionButtons}</div>
      </div>
    </div>
  );
}
