import { ChevronLeft } from "lucide-react";
import React from "react";

const BackTo = ({ title, onClick }: { title: string; onClick: () => void }) => {
  return (
    <>
      <style>{`
        .text-with-border {
          color: white;
          text-shadow:
            -1px -1px 0 rgba(0, 0, 0, 1),
            1px -1px 0 rgba(0, 0, 0, 1),
            -1px 1px 0 rgba(0, 0, 0, 1),
            1px 1px 0 rgba(0, 0, 0, 1),
            -0.5px -0.5px 0 rgba(0, 0, 0, 1),
            0.5px -0.5px 0 rgba(0, 0, 0, 1),
            -0.5px 0.5px 0 rgba(0, 0, 0, 1),
            0.5px 0.5px 0 rgba(0, 0, 0, 1);
        }
        .icon-with-border {
          filter: drop-shadow(-0.5px -0.5px 0 rgba(0, 0, 0, 1))
                  drop-shadow(0.5px -0.5px 0 rgba(0, 0, 0, 1))
                  drop-shadow(-0.5px 0.5px 0 rgba(0, 0, 0, 1))
                  drop-shadow(0.5px 0.5px 0 rgba(0, 0, 0, 1));
        }
      `}</style>
      <button
        onClick={onClick}
        className="group flex flex-row items-center px-3 hover:cursor-pointer hover:underline hover:text-slate-300 transition-all duration-300 ease-in-out"
      >
        <ChevronLeft className="w-6 h-6 text-slate-100 group-hover:text-slate-300 group-hover:underline transition-all duration-300 ease-in-out icon-with-border" />
        <p className="font-bold text-md font-nunito text-slate-100 group-hover:text-slate-300 group-hover:underline transition-all duration-300 ease-in-out text-with-border">
          {title}
        </p>
      </button>
    </>
  );
};

export default BackTo;
