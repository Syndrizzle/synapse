import LottieAnimation from "../components/LottieAnimation";
import UploadLottie from "../animations/upload.json";

export const Home = () => {
  return (
    <div className="animate-in fade-in duration-700 min-h-screen flex flex-col items-center justify-center gap-y-6 px-10">
      <p className="text-white font-heading md:text-5xl text-4xl text-center">
        Unlock your inner academic glowup.
      </p>
      <p className="text-white/90 font-body text-center md:text-lg">
        Synapse helps you create instant quizzes from PDFs effortlessly 🪄
      </p>
      <div className="md:h-1/2 md:w-1/2 bg-white/10 backdrop-blur-lg rounded-2xl p-8 flex items-center justify-center border-dashed border-2 border-white/20 flex-col gap-4 hover:border-indigo-400 transition-all duration-300">
        <LottieAnimation
          animationData={UploadLottie}
          className="invert w-10 md:w-12"
        />
        <p className="text-white font-body font-bold md:text-2xl text-xl ml-4">
          Upload your PDF files
        </p>
        <p className="text-white/70 font-body md:text-lg text-center">
          Drag and drop your PDF files here or{" "}
          <label
            htmlFor="file-upload"
            className="text-indigo-400 font-body font-bold cursor-pointer"
          >
            click here
          </label>{" "}
          to upload
        </p>
        <p className="text-white/50 font-body text-xs md:text-sm text-center">
          Upto 10MB each. Maximum 5 files.
        </p>
        <input
          type="file"
          accept="application/pdf"
          className="hidden"
          id="file-upload"
        />
      </div>
    </div>
  );
};
