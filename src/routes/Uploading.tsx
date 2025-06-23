import LottieAnimation from "../components/LottieAnimation";
import UploadingLottie from "../animations/uploading.json";
import { useFileStore } from "../stores/fileStore";
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export const Uploading = () => {
  const uploadSpeed = useFileStore((state) => state.uploadSpeed);
  const { quizId } = useFileStore();
  const navigate = useNavigate();
  const toastShownRef = useRef(false);

  const formatSpeed = (speedInKB: number) => {
    if (speedInKB < 1024) {
      return `${speedInKB.toFixed(2)} KB/s`;
    } else {
      return `${(speedInKB / 1024).toFixed(2)} MB/s`;
    }
  };
  useEffect(() => {
    if (!quizId) {
      if (!toastShownRef.current) {
        toast.error("No files found to upload.");
        toastShownRef.current = true;
      }
      navigate("/");
      return;
    }
  }, [quizId, navigate]);
  return (
    <div className="bg-neutral-900 min-h-screen flex flex-col items-center justify-center p-8 gap-4">
      <header className="fixed top-0 left-0 right-0  flex items-center z-50 w-full justify-center mt-12">
        <img
          src="/logo.svg"
          alt="Synapse Logo"
          className="md:h-10 h-8 w-auto object-cover"
        />
      </header>
      <LottieAnimation
        animationData={UploadingLottie}
        className="invert md:w-32 w-28 h-32"
      />
      <div className="flex flex-col items-center justify-center gap-4">
        <p className="font-heading md:text-6xl text-4xl text-neutral-50">
          Uploading files...
        </p>
        <p className="font-body text-neutral-300 font-medium text-2xl">
          {uploadSpeed > 0 ? formatSpeed(uploadSpeed) : "Initializing..."}
        </p>
        <p className="text-neutral-300 font-body md:text-xl max-w-3xl text-center flex-col flex">
          The files are being uploaded. Depending on your internet, this should
          not take a long time. The files are only used for extracting text and
          are not stored on our servers.
        </p>
      </div>
    </div>
  );
};
