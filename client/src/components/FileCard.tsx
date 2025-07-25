import { Trash } from "lucide-react";
import { motion } from "motion/react";
import { type FileData } from "@/stores/fileStore";
import { useFileStore } from "@/stores/fileStore";
import { formatBytes } from "@/lib/utils";

interface FileCardProps {
  fileData: FileData;
}

export const FileCard = ({ fileData }: FileCardProps) => {
  const { removeFile } = useFileStore();
  const { file, thumbnail, id } = fileData;

  const handleDelete = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    removeFile(id);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
      transition={{ duration: 0.3 }}
      className="relative p-6 md:p-4 bg-neutral-900 shadow-button-outline flex flex-col items-center justify-center gap-10 rounded-xl"
    >
      <div
        className="absolute top-2 right-2 bg-neutral-900 p-2 rounded-lg text-neutral-50 transition-colors duration-200 cursor-pointer hover:bg-red-400 hover:text-neutral-900 active:bg-red-400 active:text-neutral-900"
        title="Delete File"
        onClick={handleDelete}
      >
        <Trash />
      </div>
      <motion.img
        initial={{ opacity: 0, scale: 1.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        src={thumbnail}
        alt="PDF Thumbnail"
        className="h-48 w-3/5 -rotate-12 border-8 border-neutral-200 object-contain pointer-events-none bg-neutral-800 mt-6"
      />
      <div className="flex flex-col items-center gap-1 text-center w-11/12">
        <p className="font-body text-xl text-neutral-50 truncate w-full">
          {file.name}
        </p>
        <p className="font-body text-neutral-300 text-sm">
          {formatBytes(file.size)}
        </p>
      </div>
    </motion.div>
  );
};
