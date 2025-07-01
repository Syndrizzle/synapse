import { ArrowLeft, Upload, Search } from "lucide-react";
import { Button } from "@/components/Button";
import { UploadArea } from "@/components/UploadArea";
import { useFileStore } from "@/stores/fileStore";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useIsMobile } from "@/hooks/useIsMobile";
import { generateQuiz } from "@/services/api";
import { useState } from "react";

const UploadPage = () => {
  const { files, clearFiles, setUploadSpeed, searchEnabled } = useFileStore();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [useSearch, setUseSearch] = useState(true);

  const handleGoBack = () => {
    clearFiles();
    navigate("/");
  };

  const handleConfirmUpload = async () => {
    if (files.length === 0) {
      toast.error("Please upload at least one file.");
      return;
    }

    navigate("/uploading");

    try {
      await generateQuiz(files, useSearch, () => {
        // The new API service reports progress as a percentage, but the old
        // implementation reported it as KB/s. Since the new implementation
        // does not track time, we will pass a dummy value of 0 for now. In
        // a future refactor, we can update the UI to show a progress bar
        // instead of a speed indicator.
        setUploadSpeed(0);
      });
      navigate("/analyzing");
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("An error occurred during upload.");
      navigate("/error");
    }
  };

  const headerContent = (
    <div className="flex flex-col gap-4">
      <img
        src="/logo.svg"
        alt=" Synapse Logo"
        className="lg:w-2/3 lg:h-12 md:w-full w-1/2"
      />
      <div className="flex flex-col gap-2">
        <p className="font-heading lg:text-5xl text-3xl text-neutral-50 my-2">
          Review Your Files
        </p>
        <p className="text-neutral-300 text-lg font-body">
          Manage and review your uploaded files before processing them.
        </p>
      </div>
    </div>
  );

  const actionButtons = (
    <>
      <div className="flex w-full gap-2">
        {searchEnabled && (
          <Button
            variant={useSearch ? "default" : "outline"}
            onClick={() => setUseSearch(!useSearch)}
            className="w-1/6 md:w-1/4"
          >
            <Search size={20} strokeWidth={2.5} />
          </Button>
        )}        <Button
          disabled={files.length === 0}
          holdToConfirm
          onHoldComplete={handleConfirmUpload}
          className="w-full"
        >
          <Upload strokeWidth={2.5} />
          Hold to Upload
        </Button>
      </div>
      <Button variant={"destructive"} holdToConfirm onHoldComplete={handleGoBack}>
        <ArrowLeft strokeWidth={2.5} />
        Hold to Go Back
      </Button>
    </>
  );

  if (isMobile) {
    return (
      <>
        <div className="bg-neutral-900 h-screen flex flex-col px-6 py-10 gap-6">
          {headerContent}
          <div className="flex-grow pb-44">
            <UploadArea />
          </div>
        </div>
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-neutral-900 border-t border-neutral-800 flex flex-col gap-4">
          {actionButtons}
        </div>
      </>
    );
  }

  return (
    <div className="bg-neutral-900 h-screen lg:p-6 p-4 flex gap-6">
      <UploadArea />
      <div className="flex flex-col lg:w-1/3 w-2/5 justify-between">
        <div className="lg:p-4 p-4">{headerContent}</div>
        <div className="w-full flex flex-col gap-2 px-2">{actionButtons}</div>
      </div>
    </div>
  );
};

export default UploadPage;
