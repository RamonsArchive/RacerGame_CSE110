"use client"; // page renders client side Essential for user interaction
import React, { useEffect } from "react";
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
import { GameState, GameStatus } from "@/app/constants/index_typeracer";
import { loadGameState } from "@/lib/utils_typeracer";
import TR_SetupScreen from "@/app/components/TR_SetupScreen";
import TR_ActiveScreen from "@/app/components/TR_ActiveScreen";
import TR_FinishedScreen from "@/app/components/TR_FinishedScreen";

const TypeRacerPage = () => {
  const [gameStatus, setGameStatus] = useState<GameStatus>("setup");
  const [sessionState, setSessionState] = useState<GameState | null>(null);

  useEffect(() => {
    const savedState = loadGameState();
    if (savedState) {
      setSessionState(savedState);
      setGameStatus(savedState.status);
    }
  }, []);

  return (
    <>
      {gameStatus === "setup" && <TR_SetupScreen />}
      {gameStatus === "active" && <TR_ActiveScreen />}
      {gameStatus === "finished" && <TR_FinishedScreen />}
    </>
  );
};

export default TypeRacerPage;
