import { FileCard } from "./FileCard"

export const UploadArea = () => {
    return (
      <div className="bg-neutral-800 border-2 border-dashed border-neutral-500 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 w-full h-full gap-6 p-4 shadow-2xl shadow-neutral-950/60 lg:grid-rows-2">
        <FileCard />
        <FileCard />
        <FileCard />
        <FileCard />
        <FileCard />
        <FileCard />
      </div>
    );
}
