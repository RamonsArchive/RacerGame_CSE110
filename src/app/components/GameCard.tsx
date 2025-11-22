"use client";

import React from "react";
import { GameType } from "@/lib/GlobalTypes";
import Image from "next/image";
import Link from "next/link";
const GameCard = ({ game }: { game: GameType }) => {
  const { id, title, description, image_path, type, href } = game;
  return (
    <Link
      id={id}
      className="flex w-full h-full p-6 rounded-xl border border-primary-100 shadow-lg bg-white/70 hover:scale-105 hover:shadow-xl hover:bg-white/80 transition-all duration-300 ease-in-out"
      href={href}
    >
      <div className="flex flex-row w-full h-full gap-5">
        <div className="relative w-[33%] min-w-[120px] aspect-square">
          <Image
            src={image_path}
            alt={title}
            fill
            className="object-contain rounded-lg shadow-md"
          />
        </div>
        <div className="flex flex-col flex-1 gap-3">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold bg-linear-to-r from-slate-700 via-slate-800 to-slate-900 bg-clip-text text-transparent">
              {title}
            </h1>
            <div className="flex">
              {type === "main" ? (
                <div className="flex flex-center bg-linear-to-r from-primary-200 to-primary-300 text-white rounded-full px-3 py-1 shadow-md">
                  <p className="text-sm font-bold">Main Game</p>
                </div>
              ) : (
                <div className="flex flex-center bg-linear-to-r from-secondary-200 to-secondary-300 text-white rounded-full px-3 py-1 shadow-md">
                  <p className="text-sm font-bold">Mini Game</p>
                </div>
              )}
            </div>
          </div>
          <p className="text-sm text-slate-700 leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </Link>
  );
};

export default GameCard;
