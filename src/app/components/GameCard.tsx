import React from "react";
import { GameType } from "@/lib/GlobalTypes";
import Image from "next/image";
import Link from "next/link";
const GameCard = ({ game }: { game: GameType }) => {
  const { id, title, description, image_path, type, href } = game;
  console.log(game);
  return (
    <Link
      id={id}
      className="flex flex-col w-full h-fit p-6 rounded-xl border border-primary-100 shadow-lg hover:scale-105 hover:shadow-xl hover:bg-gradient-to-br hover:from-primary-50/20 hover:via-secondary-50/20 hover:to-tertiary-50/20 transition-all duration-300 ease-in-out"
      href={href}
    >
      <div className="flex flex-row w-full h-fit gap-5">
        <div className="flex flex-center w-[33%]">
          <Image
            src={image_path}
            alt={title}
            width={100}
            height={100}
            className="object-cover rounded-lg w-full h-full shadow-md"
          />
        </div>
        <div className="flex flex-col flex-1 gap-3">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-secondary-100 to-primary-100 bg-clip-text text-transparent">
              {title}
            </h1>
            <div className="flex">
              {type === "main" ? (
                <div className="flex flex-center bg-gradient-to-r from-primary-200 to-primary-300 text-white rounded-full px-3 py-1 shadow-md">
                  <p className="text-sm font-bold">Main Game</p>
                </div>
              ) : (
                <div className="flex flex-center bg-gradient-to-r from-secondary-200 to-secondary-300 text-white rounded-full px-3 py-1 shadow-md">
                  <p className="text-sm font-bold">Mini Game</p>
                </div>
              )}
            </div>
          </div>
          <p className="text-sm text-secondary-100 leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </Link>
  );
};

export default GameCard;
