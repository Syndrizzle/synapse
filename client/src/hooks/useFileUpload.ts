import { useFileStore } from "@/stores/fileStore";
import { useDropzone, type FileRejection } from "react-dropzone";
import { useCallback } from "react";
import { generateThumbnail } from "@/lib/pdf";
import toast from "react-hot-toast";

interface UseFileUploadOptions {
  onDropComplete?: () => void;
}

export const useFileUpload = ({ onDropComplete }: UseFileUploadOptions = {}) => {
  const {
    files,
    addFiles,
    maxFiles,
    maxFileSize,
    allowedFileTypes,
    capacityLoaded,
  } = useFileStore();

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

      // Ignore duplicates
      const existingIds = new Set(files.map((f) => f.id));
      const uniqueIncoming = acceptedFiles.filter(
        (file) => !existingIds.has(`${file.name}-${file.lastModified}`)
      );

      const remainingFiles = maxFiles - files.length;
      const filesToAccept = uniqueIncoming.slice(0, remainingFiles);
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

      if (onDropComplete) {
        onDropComplete();
      }
    },
    [files, addFiles, maxFileSize, maxFiles, onDropComplete]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: capacityLoaded
      ? allowedFileTypes.reduce(
          (acc, type) => ({ ...acc, [type]: [`.${type.split("/")[1]}`] }),
          {}
        )
      : {},
    maxSize: maxFileSize,
    disabled: !capacityLoaded || files.length >= maxFiles,
  });

  return { getRootProps, getInputProps, isDragActive };
};
