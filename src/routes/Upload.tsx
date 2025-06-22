import { ArrowLeft, Upload } from "lucide-react";
import { Button } from "../components/Button";
import { UploadArea } from "../components/UploadArea";
import { useFileStore } from "../stores/fileStore";
import { useNavigate } from "react-router-dom";

const UploadPage = () => {
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
    <div className="bg-neutral-900 w-screen h-screen p-6 flex gap-6">
      <UploadArea />
      <div className="flex flex-col w-1/3 justify-between">
        <div className="flex flex-col gap-6 p-6">
          <img src="/logo.svg" alt=" Synapse Logo" className="w-2/3 h-14" />
          <div className="flex flex-col gap-2">
            <p className="font-heading text-4xl text-neutral-50">
              Review Your Files
            </p>
            <p className="text-neutral-300 text-lg font-body">
              Manage and review your uploaded files before processing them.
            </p>
          </div>
        </div>
        <div className="w-full flex flex-col gap-4 px-2">
          <Button size={"lg"} disabled={files.length === 0}>
            <Upload strokeWidth={2.5} />
            Upload Files
          </Button>
          <Button size={"lg"} variant={"destructive"} onClick={handleGoBack}>
            <ArrowLeft strokeWidth={2.5} />
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UploadPage;
