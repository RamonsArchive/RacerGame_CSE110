"use client";
import { GAMES } from "./constants/index_home";
import GameCard from "./components/GameCard";
import Link from "next/link";

export default function Home() {
  const typeQuestGame = GAMES[0];
  const treasureHuntGame = GAMES[1];
  const unscrambleGame = GAMES[2];
  return (
    <div className="flex flex-col w-full h-dvh overflow-hidden relative">
      {/* Background Video */}
      <div className="absolute inset-0 z-0">
        <video
          src="/background.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex flex-col w-full h-full gap-15 p-10 max-w-7xl mx-auto relative z-10">
        <div className="relative flex flex-row w-full items-center">
          <h1 className="flex-1 text-8xl font-black text-center bg-linear-to-r from-tertiary-600 via-tertiary-700 to-secondary-600 bg-clip-text text-transparent drop-shadow-2xl">
            Type Quest
          </h1>
          <Link
            href="/creators"
            className="absolute right-10 flex items-center justify-center bg-linear-to-r from-primary-500 via-secondary-500 to-tertiary-500 hover:from-primary-600 hover:via-secondary-600 hover:to-tertiary-600 text-white rounded-full px-8 py-4 shadow-2xl hover:shadow-2xl border-4 border-white/80 hover:border-white transition-all duration-300 ease-in-out hover:scale-110 animate-slow-solid-glow hover:animate-none font-black text-lg backdrop-blur-sm"
          >
            <p className="text-lg font-black drop-shadow-lg">Creators</p>
          </Link>
        </div>
        <div className="flex flex-1 flex-col w-full gap-5">
          <div className="h-[240px]">
            <GameCard game={typeQuestGame} />
          </div>
          <div className="flex flex-row w-full gap-5 flex-1">
            <div className="flex-1 h-[240px]">
              <GameCard game={treasureHuntGame} />
            </div>
            <div className="flex-1 h-[240px]">
              <GameCard game={unscrambleGame} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
