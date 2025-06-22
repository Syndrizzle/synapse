import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const truncate = (str: string, length: number) => {
  if (str.length <= length) {
    return str;
  }
  return str.slice(0, length) + "...";
};
