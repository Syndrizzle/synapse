import { useFileStore } from "../stores/fileStore";
import { FileCard } from "./FileCard";
import { useDropzone, type FileRejection } from "react-dropzone";
import { useCallback } from "react";
import { generateThumbnail } from "../lib/pdf";
import { CirclePlus, Upload, Loader2 } from "lucide-react";
import { useEffect } from "react";
import { checkApiHealth } from "../services/api";
import toast from "react-hot-toast";

export const UploadArea = () => {
  const { files, addFiles, maxFiles, maxFileSize, allowedFileTypes, capacityLoaded } = useFileStore();

  // Ensure capacity is fetched if user landed directly on /upload
  useEffect(() => {
    if (!capacityLoaded) {
      checkApiHealth();
    }
  }, [capacityLoaded]);

  const onDrop = useCallback(
    async (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      fileRejections.forEach(({ file, errors }) => {
        errors.forEach((error) => {
          if (error.code === "file-too-large") {
            toast.error(
              `File "${file.name}" is too large. Max size is ${
                maxFileSize / (1024 * 1024)
              }MB.`
            );
          } else {
            toast.error(error.message);
          }
        });
      });

      // Remove files that already exist (duplicate drag)
      const existingIds = new Set(files.map((f) => f.id));
      const uniqueIncoming = acceptedFiles.filter(
        (file) => !existingIds.has(`${file.name}-${file.lastModified}`)
      );

      const currentFileCount = files.length;
      const remainingSlots = maxFiles - currentFileCount;
      const filesToAccept = uniqueIncoming.slice(0, remainingSlots);
      const rejectedCount = uniqueIncoming.length - filesToAccept.length;

      if (rejectedCount > 0) {
        toast.error(
          `${rejectedCount} file(s) were not accepted because the maximum of ${maxFiles} files has been reached.`
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
    [files, addFiles, maxFileSize, maxFiles]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: capacityLoaded
      ? allowedFileTypes.reduce((acc, type) => ({ ...acc, [type]: [`.${type.split('/')[1]}`] }), {})
      : {},
    maxSize: maxFileSize,
    disabled: !capacityLoaded || files.length >= maxFiles,
  });

  const remainingFiles = capacityLoaded ? maxFiles - files.length : 0;

  return (
    <div
      {...getRootProps()}
      className={`bg-neutral-800 border-2 border-dashed border-neutral-500 w-full h-full gap-6 p-4 shadow-2xl shadow-neutral-950/60 transition-colors duration-300 overflow-y-auto ${isDragActive ? "border-yellow-300 bg-neutral-700" : ""} ${files.length > 0 ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "flex items-center justify-center"} ${files.length < 7 ? "md:grid-rows-2" : ""} ${files.length >= maxFiles ? "cursor-not-allowed" : "cursor-pointer"}`}
    >
      <input {...getInputProps()} />

      {files.length > 0 ? (
        <>
          {files.map((fileData) => (
            <FileCard key={fileData.id} fileData={fileData} />
          ))}
          {files.length < maxFiles && (
            <div className="md:hidden flex items-center justify-center text-neutral-400 font-body md:text-3xl text-xl text-center border-dashed border-neutral-500 p-2 border-2 gap-4">
              <CirclePlus className="w-5 h-5"/>
              Add more files
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center h-full text-center pointer-events-none gap-2">
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
        </div>
      )}
    </div>
  );
};
