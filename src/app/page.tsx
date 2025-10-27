// since I've not done "use client", this page is server side rendered by default (faster) which is good becuase I don't need state manemgment logic or buttons
import { GAMES } from "./constants/index_home";
import GameCard from "./components/GameCard";

export default function Home() {
  const typeQuestGame = GAMES[0];
  const treasureHuntGame = GAMES[1];
  const unscrambleGame = GAMES[2];
  return (
    <div className="flex flex-col w-full h-dvh bg-linear-to-br from-primary-800 via-secondary-800 to-tertiary-700">
      <div className="flex flex-col w-full h-full gap-15 p-10 max-w-7xl mx-auto">
        <h1 className="text-8xl font-black text-center bg-linear-to-r from-secondary-100 via-primary-100 to-tertiary-100 bg-clip-text text-transparent animate-pulse drop-shadow-2xl">
          Type Quest
        </h1>
        <div className="flex flex-col w-full gap-5">
          <GameCard game={typeQuestGame} />
          <div className="flex flex-row w-full gap-5">
            <GameCard game={treasureHuntGame} />
            <GameCard game={unscrambleGame} />
          </div>
        </div>
      </div>
    </div>
  );
}
