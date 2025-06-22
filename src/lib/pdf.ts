import * as pdfjs from "pdfjs-dist";
import { GlobalWorkerOptions } from "pdfjs-dist";

if (typeof window !== "undefined") {
  GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
}

export const generateThumbnail = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  const page = await pdf.getPage(1); 

  const viewport = page.getViewport({ scale: 0.5 });
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Could not get canvas context");
  }

  canvas.height = viewport.height;
  canvas.width = viewport.width;

  await page.render({ canvasContext: context, viewport }).promise;

  return canvas.toDataURL("image/webp", 0.8);
};
