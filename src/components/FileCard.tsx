import { Trash } from "lucide-react";
import { motion } from "motion/react";

export const FileCard = () => {
  return (
    <div className="relative p-4 bg-neutral-900 flex flex-col items-center justify-center gap-8 rounded-lg shadow-md">
      <div className="absolute top-2 right-2 bg-neutral-900 p-2 rounded text-neutral-50 transition-colors duration-300 cursor-pointer hover:bg-yellow-400 hover:text-neutral-900" title="Delete File">
        <Trash />
      </div>
      <motion.img
        initial={{ opacity: 0, scale: 1.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        src="/example.webp"
        alt="PDF Thumbnail"
        className="h-48 w-3/5 -rotate-12 border-8 border-neutral-200 object-cover pointer-events-none"
      />
      <div className="flex flex-col items-center gap-1 text-center w-11/12">
        <p className="font-body text-xl text-neutral-50 truncate w-full">
          Example PDF Title Example PDF Title
        </p>
        <p className="font-body text-neutral-300 text-sm">Example PDF Size</p>
      </div>
    </div>
  );
}
