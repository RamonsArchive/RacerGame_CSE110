import React from "react";
import { CreatorType } from "@/lib/GlobalTypes";
import Image from "next/image";
import Link from "next/link";
import { LinkedinIcon } from "lucide-react";
const CreatorCard = ({ creator }: { creator: CreatorType }) => {
  const {
    id,
    name,
    year,
    major,
    favorite_movie,
    project_focus,
    src,
    linkedin,
  } = creator;
  return (
    <div className="flex flex-col w-full p-6 rounded-xl border-2 border-tertiary-200 shadow-lg bg-white/80 backdrop-blur-sm hover:scale-105 hover:shadow-xl hover:bg-white/90 hover:border-tertiary-300 transition-all duration-300 ease-in-out">
      <div className="flex flex-row w-full gap-5">
        <div className="relative aspect-square w-[50%] min-w-[120px]">
          <Image
            src={src}
            alt={name}
            fill
            className="object-cover rounded-lg shadow-md border-2 border-tertiary-200"
          />
        </div>
        <div className="flex flex-col flex-1 gap-3">
          <div className="flex flex-col gap-2">
            <h1 className="text-xl font-bold bg-linear-to-r from-slate-700 via-slate-800 to-slate-900 bg-clip-text text-transparent">
              {name}
            </h1>
            <p className="text-sm font-semibold text-slate-600">
              {year} • {major}
            </p>
          </div>
          {favorite_movie && (
            <div className="flex flex-col gap-1">
              <p className="text-xs font-medium text-slate-500">
                Favorite Movie
              </p>
              <p className="text-sm text-slate-700">{favorite_movie}</p>
            </div>
          )}
          <div className="flex flex-col gap-1">
            <p className="text-xs font-medium text-slate-500">Project Focus</p>
            <p className="text-sm text-slate-700 leading-relaxed">
              {project_focus}
            </p>
          </div>
          <Link
            href={linkedin as string}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-linear-to-r from-tertiary-400 to-secondary-400 hover:from-tertiary-500 hover:to-secondary-500 text-white rounded-lg font-semibold text-sm transition-all duration-300 ease-in-out hover:scale-105 shadow-md hover:shadow-lg w-fit cursor-pointer"
          >
            <LinkedinIcon className="w-4 h-4" />
            <span>LinkedIn</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CreatorCard;
