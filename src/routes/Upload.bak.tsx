import React, { useState, useRef, useCallback, useEffect } from "react";
import { CirclePlus, Trash2, Upload, X } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { formatFileSize } from "../config/env";
import type { DragState } from "../types/upload";
import { cn, truncate } from "../lib/utils";

export const UploadRoute = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    uploadState,
    addFiles,
    removeFile,
    startUpload,
    cancelUpload,
    clearErrors,
  } = useFileUpload();

  const { phase, files, errors, isUploading } = uploadState;

  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    dragCounter: 0,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const filesAddedRef = useRef(false);

  useEffect(() => {
    if (location.state?.files?.length > 0 && !filesAddedRef.current) {
      addFiles(location.state.files);
      navigate(location.pathname, { replace: true, state: {} });
      filesAddedRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUpload = async () => {
    const result = await startUpload();
    if (result) {
      console.log("Upload successful:", result);
    }
  };

  const handleGoBack = () => {
    files.forEach((file) => removeFile(file.id));
    navigate("/");
  };

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setDragState((prev) => ({
      isDragging: true,
      dragCounter: prev.dragCounter + 1,
    }));
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setDragState((prev) => {
      const newCounter = prev.dragCounter - 1;
      return {
        isDragging: newCounter > 0,
        dragCounter: newCounter,
      };
    });
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      setDragState({ isDragging: false, dragCounter: 0 });

      const files = Array.from(e.dataTransfer.files);
      const pdfFiles = files.filter((file) => file.type === "application/pdf");

      if (pdfFiles.length > 0) {
        addFiles(pdfFiles);
      }
    },
    [addFiles]
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length > 0) {
        addFiles(files);
      }
      e.target.value = "";
    },
    [addFiles]
  );

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-y-6 px-6 md:px-10">
      <div className="text-center">
        <p className="text-white font-heading md:text-4xl text-3xl">
          Review & Upload Files
        </p>
        <p className="text-white/90 font-body text-center md:text-lg mt-4">
          Manage your files and generate your quiz
        </p>
      </div>

      <div className="w-full max-w-3xl">
        <div className="mb-6">
          <div
            className={`
              relative bg-white/10 backdrop-blur-lg rounded-xl px-4 py-4 
              border-2 border-dashed border-white/20 transition-all duration-300
              ${
                dragState.isDragging
                  ? "scale-105 border-indigo-400 bg-white/20"
                  : ""
              }
            `}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              multiple
              className="hidden"
              onChange={handleFileInputChange}
            />

            <div className="space-y-4 flex items-center justify-center flex-col">
              <div
                className={cn(
                  "gap-3 grid w-full",
                  files.length > 2 ? "md:grid-rows-2" : "md:grid-rows-1",
                  files.length === 1 ? "md:grid-cols-1" : "md:grid-cols-2"
                )}
              >
                {files.map((fileData) => (
                  <div
                    key={fileData.id}
                    className={cn(
                      "flex flex-col md:flex-row md:items-center md:justify-between px-4 py-3 rounded-lg bg-white/5 transition-all duration-300 border border-white/20",
                      uploadState.duplicateFileId === fileData.id && "flash-bg"
                    )}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex-1 min-w-0">
                        {/* Mobile Layout */}
                        <div className="md:hidden gap-1 flex flex-col">
                          <div className="flex items-center justify-between">
                            <div>
                              <p
                                className="text-white font-bold truncate font-body"
                                title={fileData.file.name}
                              >
                                {truncate(fileData.file.name, 22)}
                              </p>
                              <p className="text-white/60 text-sm font-body ">
                                {formatFileSize(fileData.file.size)}
                              </p>
                            </div>
                            {!isUploading &&
                              (fileData.status === "pending" ||
                                fileData.status === "error") && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeFile(fileData.id);
                                  }}
                                  className="cursor-pointer ml-2 text-white/80 transition-colors p-2 bg-red-500/30 rounded-lg hover:bg-red-500/50 hover:text-white flex items-center gap-2 font-body"
                                  title="Remove file"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                          </div>

                          <div className="w-full">
                            <ProgressBar
                              progress={fileData.progress}
                              status={fileData.status}
                            />
                          </div>
                        </div>

                        {/* Desktop Layout */}
                        <div className="hidden md:block">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <p
                                className="text-white font-bold text-base truncate font-body"
                                title={fileData.file.name}
                              >
                                {truncate(fileData.file.name, 30)}
                              </p>
                              <p className="text-white/60 text-xs font-body">
                                {formatFileSize(fileData.file.size)}
                              </p>
                            </div>

                            <div className="flex items-center gap-4 ml-4">
                              <div
                                className={files.length === 1 ? "w-48" : "w-32"}
                              >
                                <ProgressBar
                                  progress={fileData.progress}
                                  status={fileData.status}
                                />
                              </div>
                              {!isUploading &&
                                (fileData.status === "pending" ||
                                  fileData.status === "error") && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeFile(fileData.id);
                                    }}
                                    className="cursor-pointer text-white/80 transition-colors p-2 bg-red-500/30 rounded-lg hover:bg-red-500/50 hover:text-white flex items-center gap-2 font-body"
                                    title="Remove file"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    {files.length === 1 && "Delete"}
                                  </button>
                                )}
                            </div>
                          </div>
                        </div>

                        {fileData.status === "error" && fileData.error && (
                          <p className="text-red-400 text-xs mt-1">
                            {fileData.error}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleClick}
                className="w-full p-3 border-2 border-dashed border-white/20 rounded-lg text-white/70 hover:text-white hover:border-indigo-400 transition-all duration-300 flex items-center justify-center cursor-pointer font-body md:text-lg bg-white/5 hover:bg-white/10 gap-x-3"
              >
                <CirclePlus size={20} />
                Add more files
              </button>
            </div>
          </div>
        </div>

        <div className="animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
            {!isUploading && phase !== "completed" && (
              <>
                <button
                  onClick={handleUpload}
                  disabled={files.length === 0}
                  className="
                    bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed
                    text-white font-medium px-8 py-3 rounded-lg transition-all duration-200
                    flex items-center gap-2 min-w-[200px] justify-center
                  "
                >
                  <Upload className="w-5 h-5" />
                  Generate Quiz
                </button>

                <button
                  onClick={handleGoBack}
                  className="
                    bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/30
                    font-medium px-6 py-3 rounded-lg transition-all duration-200
                    flex items-center gap-2
                  "
                >
                  <X className="w-4 h-4" />
                  Clear All
                </button>
              </>
            )}

            {isUploading && (
              <button
                onClick={cancelUpload}
                className="
                  bg-red-600 hover:bg-red-700 text-white font-medium px-8 py-3 rounded-lg 
                  transition-all duration-200 flex items-center gap-2 min-w-[200px] justify-center
                "
              >
                <X className="w-5 h-5" />
                Cancel Upload
              </button>
            )}

            {phase === "completed" && (
              <button
                onClick={() => window.location.reload()}
                className="
                  bg-green-600 hover:bg-green-700 text-white font-medium px-8 py-3 rounded-lg 
                  transition-all duration-200 flex items-center gap-2 min-w-[200px] justify-center
                "
              >
                Quiz Generated Successfully! 🎉
              </button>
            )}
          </div>
        </div>

        {errors.length > 0 && (
          <div className="mt-6 animate-in slide-in-from-bottom-2 duration-300">
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-red-400 font-medium mb-2">
                    Upload Errors
                  </h3>
                  <ul className="text-red-300 text-sm space-y-1">
                    {errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
                <button
                  onClick={clearErrors}
                  className="text-red-400 hover:text-red-300 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
