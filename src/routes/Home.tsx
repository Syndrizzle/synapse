import LottieAnimation from "../components/LottieAnimation";
import UploadLottie from "../animations/upload.json";
import { config } from "../config/env";
import { useDropzone, type FileRejection } from "react-dropzone";
import { useNavigate } from "react-router-dom";
import { useFileStore } from "../stores/fileStore";
import { generateThumbnail } from "../lib/pdf";
import { useCallback } from "react";
import toast from "react-hot-toast";

export const Home = () => {
  const navigate = useNavigate();
  const { files, addFiles } = useFileStore();

  const onDrop = useCallback(
    async (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      fileRejections.forEach(({ file, errors }) => {
        errors.forEach((error) => {
          if (error.code === "file-too-large") {
            toast.error(
              `File "${file.name}" is too large. Max size is ${
                config.maxFileSize / (1024 * 1024)
              }MB.`
            );
          } else {
            toast.error(error.message);
          }
        });
      });

      const currentFileCount = files.length;
      const remainingSlots = config.maxFiles - currentFileCount;
      const filesToAccept = acceptedFiles.slice(0, remainingSlots);
      const rejectedCount = acceptedFiles.length - filesToAccept.length;

      if (rejectedCount > 0) {
        toast.error(
          `${rejectedCount} file(s) were not accepted because the maximum of ${config.maxFiles} files has been reached.`
        );
      }

      if (filesToAccept.length === 0) return;

      const fileDataPromises = filesToAccept.map(async (file) => {
        const thumbnail = await generateThumbnail(file);
        return {
          id: `${file.name}-${file.lastModified}`,
          file,
          thumbnail,
        };
      });
      const fileData = await Promise.all(fileDataPromises);
      addFiles(fileData);
      navigate("/upload");
    },
    [files, addFiles, navigate]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxSize: config.maxFileSize,
    disabled: files.length >= config.maxFiles,
  });

  return (
    <div className="min-h-screen bg-neutral-900 flex flex-col items-center justify-center gap-y-6 px-6 md:px-10">
      <header className="fixed top-0 left-0 right-0  flex items-center z-50 w-full justify-center mt-12">
        <img
          src="/logo.svg"
          alt="Synapse Logo"
          className="md:h-10 h-8 w-auto object-cover"
        />
      </header>
      <div className="text-center">
        <p className="text-neutral-50 font-heading md:text-5xl text-4xl text-center">
          Unlock your inner academic glowup.
        </p>
        <p className="text-neutral-200 font-body text-center md:text-lg mt-4">
          Synapse helps you create instant quizzes from your notes effortlessly
          🪄
        </p>
      </div>
      <div
        {...getRootProps()}
        className="w-full max-w-3xl shadow-2xl shadow-neutral-950/60"
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
                className="invert w-10 md:w-12"
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
                <span className="text-yellow-300 font-bold">click here</span> to
                upload
              </p>

              <p className="text-neutral-400 font-body text-xs md:text-sm text-center mt-2">
                Up to {config.maxFileSize / (1024 * 1024)}MB each. Maximum{" "}
                {config.maxFiles} files.
              </p>
            </div>
          </div>
        </div>
      </div>
      <a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer">
        <footer className="fixed bottom-0 left-0 right-0 flex-row gap-x-2 flex items-center z-50 w-full justify-center mb-6 opacity-70 hover:opacity-100 transition-opacity">
          <p className="font-body text-neutral-50">Powered by</p>
          <img
            src="/openrouter.svg"
            alt="Synapse Logo"
            className="h-10 w-auto object-cover"
          />
        </footer>
      </a>
    </div>
  );
};
