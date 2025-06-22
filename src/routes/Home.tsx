import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from "react-router-dom";
import LottieAnimation from '../components/LottieAnimation';
import UploadLottie from '../animations/upload.json';
import FilesLottie from '../animations/files.json';
import { config } from '../config/env';
import type { DragState } from '../types/upload';

export const Home = () => {
  const navigate = useNavigate();
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    dragCounter: 0,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFilesAdded = useCallback((files: File[]) => {
    navigate('/upload', { state: { files } });
  }, [navigate]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setDragState(prev => ({
      isDragging: true,
      dragCounter: prev.dragCounter + 1,
    }));
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setDragState(prev => {
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

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setDragState({ isDragging: false, dragCounter: 0 });
    
    const files = Array.from(e.dataTransfer.files);
    const pdfFiles = files.filter(file => file.type === 'application/pdf');
    
    if (pdfFiles.length > 0) {
      handleFilesAdded(pdfFiles);
    }
  }, [handleFilesAdded]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFilesAdded(files);
    }
    e.target.value = '';
  }, [handleFilesAdded]);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const getDragStyles = () => {
    if (dragState.isDragging) {
      return 'scale-105 border-yellow-300';
    }
    return "hover:bg-neutral-700 border-neutral-500 hover:border-yellow-300 transition-colors duration-300";
  };

  return (
    <div className="min-h-screen bg-neutral-900 flex flex-col items-center justify-center gap-y-6 px-6 md:px-10">
      <header className="fixed top-0 left-0 right-0  flex items-center z-50 w-full justify-center mt-12">
        <img
          src="/logo.svg"
          alt="Synapse Logo"
          className="md:h-10 h-8 w-auto object-cover"
        />
      </header>
      <div className="text-center">
        <p className="text-neutral-50 font-heading md:text-5xl text-4xl text-center">
          Unlock your inner academic glowup.
        </p>
        <p className="text-neutral-200 font-body text-center md:text-lg mt-4">
          Synapse helps you create instant quizzes from your notes effortlessly 🪄
        </p>
      </div>
      <div className="w-full max-w-3xl shadow-2xl shadow-neutral-950/60">
        <div
          className={`
            relative bg-neutral-800 px-4 py-8 
            transition-all duration-300 cursor-pointer border-2 border-dashed
            ${getDragStyles()}
          `}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={handleClick}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            multiple
            className="hidden"
            onChange={handleFileInputChange}
          />

          <div className="flex items-center justify-center flex-col gap-4">
            <div className="flex items-center justify-center">
              {dragState.isDragging ? (
                <LottieAnimation
                  animationData={FilesLottie}
                  className="invert w-10 md:w-12"
                />
              ) : (
                <LottieAnimation
                  animationData={UploadLottie}
                  className="invert w-10 md:w-12"
                />
              )}
            </div>

            <div className="text-center">
              <p className="text-neutral-50 font-body font-bold md:text-2xl text-xl">
                {dragState.isDragging
                  ? "Drop your PDF files here"
                  : "Upload your PDF files"}
              </p>

              <p className="text-neutral-200 font-body md:text-lg text-center mt-2">
                Drag and drop your PDF files here or{" "}
                <span className="text-yellow-300 font-bold">click here</span> to
                upload
              </p>

              <p className="text-neutral-400 font-body text-xs md:text-sm text-center mt-2">
                Up to {config.maxFileSize / (1024 * 1024)}MB each. Maximum{" "}
                {config.maxFiles} files.
              </p>
            </div>
          </div>
        </div>
      </div>
      <a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer">
        <footer className="fixed bottom-0 left-0 right-0 flex-row gap-x-2 flex items-center z-50 w-full justify-center mb-12 opacity-70 hover:opacity-100 transition-opacity">
          <p className="font-body text-neutral-50">Powered by</p>
          <img
            src="/openrouter.svg"
            alt="Synapse Logo"
            className="h-10 w-auto object-cover"
          />
        </footer>
      </a>
    </div>
  );
};
