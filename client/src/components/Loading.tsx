import { LoaderCircle } from "lucide-react";
import useRotatingMotd from "@/hooks/useRotatingMotd";

export const Loading = () => {
  const currentMotd = useRotatingMotd();

  return (
    <div className="bg-neutral-900 min-h-screen flex flex-col items-center justify-center p-6">
      <header className="absolute top-0 right-0 left-0 mt-10 flex items-center w-full justify-center">
        <img
          src="/logo.svg"
          alt="Synapse Logo"
          className="md:h-10 h-8 w-auto object-cover m-2"
        />
      </header>

      <div className="flex flex-col items-center justify-center gap-6">
        <div className="animate-spin text-neutral-50">
          <LoaderCircle className="md:w-12 md:h-12 w-8 h-8" />
        </div>
        <p className="font-body md:text-4xl text-3xl text-neutral-50 text-center">
          {currentMotd}
        </p>
      </div>
    </div>
  );
};
