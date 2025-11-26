import React from "react";
import { CREATORS } from "@/app/constants/index_creators";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import CreatorCard from "@/app/components/CreatorCard";

const CreatorsPage = () => {
  return (
    <main className="flex flex-col w-full h-dvh overflow-hidden relative">
      <div className="absolute inset-0 z-0">
        <video
          src="/moon1.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex flex-col w-full h-full gap-10 p-10 max-w-7xl mx-auto relative z-10 overflow-hidden">
        <div className="relative flex flex-row w-full items-center shrink-0">
          <Link
            href="/"
            className="absolute left-0 flex items-center gap-2 px-6 py-3 bg-linear-to-r from-primary-500 via-secondary-500 to-tertiary-500 hover:from-primary-600 hover:via-secondary-600 hover:to-tertiary-600 text-white rounded-full font-bold transition-all duration-300 ease-in-out hover:scale-110 shadow-lg hover:shadow-xl border-2 border-white/60 hover:border-white backdrop-blur-sm cursor-pointer z-10"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Back to Home</span>
          </Link>
          <h1 className="flex-1 text-8xl md:text-6xl font-black text-center bg-linear-to-r from-primary-600 via-tertiary-500 to-secondary-600 bg-clip-text text-transparent drop-shadow-2xl">
            Creators
          </h1>
        </div>
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto scrollbar-hidden px-4 py-3 rounded-xl">
          {CREATORS.map((creator) => (
            <CreatorCard key={creator.id} creator={creator} />
          ))}
        </div>
      </div>
    </main>
  );
};

export default CreatorsPage;
