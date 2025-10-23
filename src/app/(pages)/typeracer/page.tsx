"use client"; // page renders client side Essential for user interaction
import React from "react";
import { useEffect } from "react";
// only some of things to import
import {
  Stage,
  Layer,
  Text,
  Rect,
  Circle,
  Line,
  Shape,
  Path,
  TextPath,
  Image,
  Group,
  Transformer,
} from "react-konva";
import * as Konva from "konva";
import { useState } from "react";

const TypeRacerPage = () => {
  const [value, setValue] = useState("");
  const [lines, setLines] = useState<string[]>([]);

  const title = "Begin Typing";
  const WIDTH = 800;
  const HEIGHT = 500;

  const handleSubmit = () => {
    const v = value.trim();
    if (!v) return;
    setLines((prev) => [...prev, v]);
    setValue("");
  };

  const handleClearData = (text: string) => {
    if (lines.length === 0 || value == "") return;
    setLines([]);
    setValue("");
    console.log("This is a success statement", text);
  };

  return (
    <div
      id="container"
      className="flex flex-col items-center justify-center w-full min-h-screen bg-primary-200"
    >
      <Stage
        width={WIDTH}
        height={HEIGHT}
        className="w-full h-full flex-center bg-primary-200"
      >
        <Layer>
          <Rect x={0} y={0} width={WIDTH} height={HEIGHT} fill="#0f172a" />
          <Text
            x={20}
            y={16}
            text={"Begin Typing"}
            fontSize={24}
            fontWeight="bold"
            fill="#e5e7eb"
          />
          {/* submitted lines */}
          {lines.map((t, i) => (
            <Text
              key={i}
              x={20}
              y={70 + i * 26}
              text={t}
              fontSize={20}
              fill="#a7f3d0"
            />
          ))}
        </Layer>
      </Stage>
      <div className="flex flex-row gap-2 items-center pt-10">
        <div className=" flex gap-2">
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="Type and press Enter"
            className="px-3 py-2 rounded-md bg-[#0f172a] text-white border border-slate-600 w-[600px]"
          />
          <button
            onClick={handleSubmit}
            className="px-4 py-2 rounded-md bg-slate-800 text-white border border-slate-500"
          >
            Submit
          </button>
        </div>
        <div className="flex h-fit ">
          <button
            className="px-4 py-2 rounded-md bg-slate-700 text-white border border-slate-500 hover:scale-105 transition-all duration-300 ease-in-out"
            onClick={() => handleClearData("Clear Data")}
          >
            Clear Data
          </button>
        </div>
      </div>
    </div>
  );
};

export default TypeRacerPage;
