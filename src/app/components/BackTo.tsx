import { ChevronLeft } from "lucide-react";
import React from "react";

const BackTo = ({ title, onClick }: { title: string; onClick: () => void }) => {
  return (
    <>
      <style>{`
        .text-with-border {
          color: white;
          text-shadow:
            -2px -2px 0 rgba(0, 0, 0, 1),
            2px -2px 0 rgba(0, 0, 0, 1),
            -2px 2px 0 rgba(0, 0, 0, 1),
            2px 2px 0 rgba(0, 0, 0, 1),
            -1px -1px 0 rgba(0, 0, 0, 1),
            1px -1px 0 rgba(0, 0, 0, 1),
            -1px 1px 0 rgba(0, 0, 0, 1),
            1px 1px 0 rgba(0, 0, 0, 1);
        }
      `}</style>
      <button
        onClick={onClick}
        className="group flex flex-row items-center px-3 hover:cursor-pointer hover:underline hover:text-slate-300 transition-all duration-300 ease-in-out"
      >
        <ChevronLeft className="w-6 h-6 text-slate-100 group-hover:text-slate-300 group-hover:underline transition-all duration-300 ease-in-out" />
        <p className="font-bold text-md font-nunito text-slate-100 group-hover:text-slate-300 group-hover:underline transition-all duration-300 ease-in-out text-with-border">
          {title}
        </p>
      </button>
    </>
  );
};

export default BackTo;
