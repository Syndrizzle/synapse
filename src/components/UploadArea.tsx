import { useFileStore } from "../stores/fileStore";
import { FileCard } from "./FileCard";
import { useDropzone, type FileRejection } from "react-dropzone";
import { useCallback } from "react";
import { generateThumbnail } from "../lib/pdf";
import { config } from "../config/env";
import { Upload } from "lucide-react";
import toast from "react-hot-toast";

export const UploadArea = () => {
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
    },
    [files, addFiles]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxSize: config.maxFileSize,
    disabled: files.length >= config.maxFiles,
  });

  const remainingFiles = config.maxFiles - files.length;

  return (
    <div
      {...getRootProps()}
      className={`bg-neutral-800 border-2 border-dashed border-neutral-500 w-full h-full gap-6 p-4 shadow-2xl shadow-neutral-950/60 transition-colors duration-300 ${
        isDragActive ? "border-yellow-300 bg-neutral-700" : ""
      } ${
        files.length > 0
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 lg:grid-rows-2"
          : "flex items-center justify-center"
      } ${
        files.length >= config.maxFiles ? "cursor-not-allowed" : "cursor-pointer"
      }`}
    >
      <input {...getInputProps()} />
      {files.length > 0 ? (
        files.map((fileData) => (
          <FileCard key={fileData.id} fileData={fileData} />
        ))
      ) : (
        <div className="flex flex-col items-center justify-center h-full text-center pointer-events-none gap-2">
          <Upload className="w-24 h-24 text-neutral-50"/>
          <p className="text-neutral-50 font-body font-bold text-3xl">
            {isDragActive
              ? "Drop your files here"
              : "Drag & drop or click to upload"}
          </p>
          <p className="text-neutral-400 font-body text-center">
            {remainingFiles > 0
              ? `You can add up to ${remainingFiles} more files.`
              : "You have reached the maximum number of files."}
          </p>
        </div>
      )}
    </div>
  );
};
