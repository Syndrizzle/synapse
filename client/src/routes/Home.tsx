import LottieAnimation from "@/components/LottieAnimation";
import UploadLottie from "@/animations/upload.json";
import { useNavigate } from "react-router-dom";
import { useFileStore } from "@/stores/fileStore";
import { useEffect, useState, useRef } from "react";
import { checkApiHealth } from "@/services/api";
import { siGithub } from "simple-icons";
import { Loader2 } from "lucide-react";
import { useFileUpload } from "@/hooks/useFileUpload";

export const Home = () => {
  const navigate = useNavigate();
  const { maxFiles, maxFileSize, capacityLoaded } = useFileStore();
  const [apiStatus, setApiStatus] = useState<"healthy" | "unhealthy" | "loading">(
    "loading"
  );

  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return; // Avoid double execution in React 18 StrictMode during development
    initializedRef.current = true;
    const healthCheck = async () => {
      try {
        const data = await checkApiHealth();
        if (data.status === "healthy") {
          setApiStatus("healthy");
        } else {
          setApiStatus("unhealthy");
        }
      } catch {
        setApiStatus("unhealthy");
      }
    };

    healthCheck();
    const intervalId = setInterval(healthCheck, 10000);

    return () => clearInterval(intervalId);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useFileUpload({
    onDropComplete: () => navigate("/upload"),
  });

  return (
    <div className="min-h-screen bg-neutral-900 flex flex-col items-center justify-between px-6 md:px-10 py-10">
      <div className="flex items-center w-full justify-center">
        <img src="/logo.svg" alt="Synapse Logo" className="md:h-10 h-8" />
      </div>
      <div className="flex flex-col gap-y-6 w-full items-center justify-center">
        <div className="text-center">
          <p className="text-neutral-50 font-heading md:text-5xl text-4xl text-center">
            Unlock your inner academic glowup.
          </p>
          <p className="text-neutral-200 font-body text-center md:text-lg mt-4">
            Synapse helps you create instant quizzes from your notes
            effortlessly 🪄
          </p>
        </div>
        <div
          {...getRootProps()}
          className="w-full shadow-2xl max-w-3xl shadow-neutral-950/60"
        >
          <input {...getInputProps()} />
          <div
            className={`
            relative bg-neutral-800 px-4 py-8 
            transition-all duration-300 cursor-pointer border-2 border-dashed hover:bg-neutral-700 border-neutral-500 hover:border-yellow-300
            ${isDragActive ? "bg-neutral-700 border-yellow-300" : ""}
          `}
          >
            <div className="flex items-center justify-center flex-col gap-4">
              <div className="flex items-center justify-center">
                <LottieAnimation
                  animationData={UploadLottie}
                  className="invert w-10 md:w-12 md:h-12 h-10"
                />
              </div>

              <div className="text-center">
                <p className="text-neutral-50 font-body font-bold md:text-2xl text-xl">
                  {isDragActive
                    ? "Drop the files here ..."
                    : "Upload your PDF files"}
                </p>

                <p className="text-neutral-200 font-body md:text-lg text-center mt-2">
                  Drag and drop your PDF files here or{" "}
                  <span className="text-yellow-300 font-bold">click here</span>{" "}
                  to upload
                </p>

                <p className="text-neutral-400 font-body text-xs md:text-sm text-center mt-2">
                  {capacityLoaded ? `Up to ${maxFileSize / (1024 * 1024)}MB each. Maximum ${maxFiles} files.` : (<><Loader2 className="w-4 h-4 animate-spin inline-block mr-1"/>Fetching upload limits...</>)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center gap-4">
        <a href="https://github.com/Syndrizzle/synapse">
          <div className="flex flex-row gap-x-2 items-center px-3 py-1 rounded bg-neutral-800 hover:bg-neutral-700 transition-colors duration-300 group">
            <svg
              viewBox="0 0 24 24"
              role="img"
              className="md:w-5 md:h-5 w-4 h-4 fill-neutral-400 group-hover:fill-neutral-50 transition-colors duration-300"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d={siGithub.path} />
            </svg>
            <p className="text-neutral-400 group-hover:text-neutral-50 transition-colors duration-300 font-body md:text-base text-sm">
              Github
            </p>
          </div>
        </a>
        <div
          className={`flex items-center gap-x-2 px-4 py-1 rounded ${
            apiStatus === "loading"
              ? "bg-neutral-800"
              : apiStatus === "healthy"
              ? "bg-green-500/20"
              : "bg-red-500/20"
          }`}
        >
          {apiStatus === "loading" ? (
            <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />
          ) : (
            <div className="relative w-4 h-4 flex items-center justify-center">
              <div
                className={`absolute w-2.5 h-2.5 rounded-full animate-ping ${
                  apiStatus === "healthy" ? "bg-green-500" : "bg-red-500"
                }`}
              />
              <div
                className={`w-1.5 h-1.5 rounded-full ${
                  apiStatus === "healthy" ? "bg-green-500" : "bg-red-500"
                }`}
              />
            </div>
          )}
          <p
            className={`text-sm md:text-base font-body ${
              apiStatus === "loading"
                ? "text-neutral-400"
                : apiStatus === "healthy"
                ? "text-green-400"
                : "text-red-400"
            }`}
          >
            {apiStatus === "loading"
              ? "Checking..."
              : apiStatus === "healthy"
              ? "Online"
              : "Offline"}
          </p>
        </div>
      </div>
    </div>
  );
};
