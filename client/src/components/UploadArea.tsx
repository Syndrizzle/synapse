import { useFileStore } from "@/stores/fileStore";
import { FileCard } from "@/components/FileCard";
import { CirclePlus, Upload, Loader2 } from "lucide-react";
import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { checkApiHealth } from "@/services/api";
import { useFileUpload } from "@/hooks/useFileUpload";
import { useTextureStore } from "@/stores/textureStore";

export const UploadArea = () => {
  const { files, maxFiles, capacityLoaded } = useFileStore();
  const { currentTexture, preloadNextTexture } = useTextureStore();

  useEffect(() => {
    preloadNextTexture();
  }, [preloadNextTexture]);

  // Ensure capacity is fetched if user landed directly on /upload
  useEffect(() => {
    if (!capacityLoaded) {
      checkApiHealth();
    }
  }, [capacityLoaded]);

  const { getRootProps, getInputProps, isDragActive } = useFileUpload();

  const remainingFiles = capacityLoaded ? maxFiles - files.length : 0;

  return (
    <div
      {...getRootProps()}
      className={`bg-neutral-950 border-2 border-dashed border-neutral-500 w-full h-full shadow-2xl shadow-neutral-950/60 transition-colors duration-300 relative ${isDragActive ? "border-yellow-300 bg-neutral-700" : ""} ${files.length >= maxFiles ? "cursor-not-allowed" : "cursor-pointer"}`}
    >
      {currentTexture && (
        <div
          className="absolute inset-0 w-full h-full"
          style={{ backgroundImage: `url(${currentTexture})` }}
        />
      )}
      <div
        className={`relative w-full h-full gap-6 p-4 overflow-y-auto ${files.length > 0 ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "flex items-center justify-center"} ${files.length < 5 ? "md:grid-rows-2" : ""}`}
      >
        <input {...getInputProps()} />

        <AnimatePresence>
          {files.length > 0 ? (
            <>
              {files.map((fileData) => (
                <FileCard key={fileData.id} fileData={fileData} />
              ))}
              {files.length < maxFiles && (
                <div className="md:hidden flex items-center justify-center text-neutral-400 font-body md:text-3xl text-xl text-center border-dashed border-neutral-500 p-2 border-2 gap-4 active:border-yellow-400 active:text-yellow-400 transition-all duration-200">
                  <CirclePlus className="w-5 h-5" />
                  Add more files
                </div>
              )}
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="flex flex-col items-center justify-center h-full text-center pointer-events-none gap-2"
            >
              <Upload className="md:w-24 md:h-24 w-16 h-16 text-neutral-50" />
              <p className="text-neutral-50 font-body font-bold md:text-3xl text-2xl">
                {isDragActive
                  ? "Drop your files here"
                  : "Drag & drop or click to upload"}
              </p>
              <p className="text-neutral-400 font-body text-center">
                {!capacityLoaded ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin inline-block mr-1" />
                    Fetching upload limits...
                  </>
                ) : remainingFiles > 0
                  ? `You can add up to ${remainingFiles} more files.`
                  : "You have reached the maximum number of files."}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
