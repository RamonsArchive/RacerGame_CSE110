// since I've not done "use client", this page is server side rendered by default (faster) which is good becuase I don't need state manemgment logic or buttons
import Image from "next/image";
import { GAMES } from "./constants/index_home";
import Link from "next/link";
import GameCard from "./components/GameCard";

export default function Home() {
  const typeRacerGame = GAMES[0];
  const treasureHuntGame = GAMES[1];
  const unscrambleGame = GAMES[2];
  return (
    <div className="flex flex-col w-full h-[100vh] bg-gradient-to-br from-primary-800 via-secondary-800 to-tertiary-700">
      <div className="flex flex-col w-full h-full gap-15 p-10 max-w-7xl mx-auto">
        <h1 className="text-8xl font-black text-center bg-gradient-to-r from-secondary-100 via-primary-100 to-tertiary-100 bg-clip-text text-transparent animate-pulse drop-shadow-2xl">
          Type Quest
        </h1>
        <div className="flex flex-col w-full gap-5">
          <GameCard game={typeRacerGame} />
          <div className="flex flex-row w-full gap-5">
            <GameCard game={treasureHuntGame} />
            <GameCard game={unscrambleGame} />
          </div>
        </div>
      </div>
    </div>
  );
}
