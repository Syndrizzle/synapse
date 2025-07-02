import LottieAnimation from "@/components/LottieAnimation";
import ErrorLottie from "@/animations/error.json";

export const Error = () => {
  return (
    <div className="bg-neutral-900 min-h-screen flex flex-col items-center justify-center p-6 gap-4">
      <a href="/">
        <header className="fixed top-0 left-0 right-0  flex items-center z-50 w-full justify-center mt-10">
          <img
            src="/logo.svg"
            alt="Synapse Logo"
            className="md:h-10 h-8 w-auto object-cover"
          />
        </header>
      </a>
      <LottieAnimation
        animationData={ErrorLottie}
        className="invert md:w-32 w-28 h-32"
      />
      <div className="flex flex-col items-center justify-center gap-4">
        <p className="font-heading md:text-6xl text-5xl text-neutral-50 text-center">
          Whoops! Something went wrong.
        </p>
        <p className="text-neutral-300 font-body md:text-xl max-w-3xl text-center flex-col flex">
          It seems like we encountered an error while processing your request.
          The developers have been notified of the error. Please try again later
          :(
        </p>
      </div>
    </div>
  );
};
