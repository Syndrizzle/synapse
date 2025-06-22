import { ArrowLeft, Upload } from "lucide-react";
import { Button } from "../components/Button";
import { UploadArea } from "../components/UploadArea";
import { useFileStore } from "../stores/fileStore";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { config } from "../config/env";
import toast from "react-hot-toast";

const UploadPage = () => {
  const { files, clearFiles, setQuizId, setUploadSpeed } = useFileStore();
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

  const handleConfirmUpload = async () => {
    if (files.length === 0) {
      toast.error("Please upload at least one file.");
      return;
    }

    navigate("/uploading");

    const formData = new FormData();
    files.forEach((fileData) => {
      formData.append("pdfs", fileData.file);
    });

    try {
      const startTime = Date.now();
      const response = await axios.post(
        `${config.apiBaseUrl}/api/quiz/generate`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent) => {
            const { loaded, total } = progressEvent;
            if (total) {
              const elapsedTime = (Date.now() - startTime) / 1000; // in seconds
              const speed = loaded / elapsedTime / 1024; // in KB/s
              setUploadSpeed(speed);
            }
          },
        }
      );

      if (response.status === 202 && response.data.data.quizId) {
        setQuizId(response.data.data.quizId);
        navigate("/analyzing");
      } else {
        toast.error("Failed to start quiz generation.");
        navigate("/error");
      }
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("An error occurred during upload.");
      navigate("/error");
    }
  };

  return (
    <div className="bg-neutral-900 h-screen p-6 flex gap-6">
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
          <Button
            size={"lg"}
            disabled={files.length === 0}
            onClick={handleConfirmUpload}
          >
            <Upload strokeWidth={2.5} />
            Confirm Upload
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
