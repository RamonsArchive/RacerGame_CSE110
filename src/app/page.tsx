"use client";
import { GAMES } from "./constants/index_home";
import GameCard from "./components/GameCard";

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
        <h1 className="text-8xl font-black text-center bg-linear-to-r from-secondary-900 via-primary-900 to-tertiary-900 bg-clip-text text-transparent animate-pulse drop-shadow-2xl">
          Type Quest
        </h1>
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
