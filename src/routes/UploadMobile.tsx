import { ArrowLeft, Upload } from "lucide-react";
import { Button } from "../components/Button";
import { UploadArea } from "../components/UploadArea";
import { useFileStore } from "../stores/fileStore";
import { useNavigate } from "react-router-dom";

const UploadMobilePage = () => {
  const { files, clearFiles } = useFileStore();
  const navigate = useNavigate();

  const handleGoBack = () => {
    if (
      window.confirm(
        "Are you sure you want to go back? All uploaded files will be removed."
      )
    ) {
      clearFiles();
      navigate("/");
    }
  };

  return (
    <>
      <div className="bg-neutral-900 min-w-screen min-h-screen flex-col px-6 py-10 flex gap-6 pb-40">
        <div className="flex flex-col justify-between">
          <div className="flex flex-col gap-6">
            <img src="/logo.svg" alt=" Synapse Logo" className="w-1/2 h-14" />
            <div className="flex flex-col gap-2">
              <p className="font-heading text-4xl text-neutral-50">
                Review Your Files
              </p>
              <p className="text-neutral-300 text-lg font-body">
                Manage and review your uploaded files before processing them.
              </p>
            </div>
          </div>
        </div>
        <UploadArea />
      </div>
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-neutral-900 border-t border-neutral-800 flex flex-col gap-4">
        <Button size={"lg"} disabled={files.length === 0}>
          <Upload strokeWidth={2.5} />
          Confirm Upload
        </Button>
        <Button size={"lg"} variant={"destructive"} onClick={handleGoBack}>
          <ArrowLeft strokeWidth={2.5} />
          Go Back
        </Button>
      </div>
    </>
  );
};

export default UploadMobilePage;
