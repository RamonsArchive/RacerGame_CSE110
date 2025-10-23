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
  return (
    <div className="flex flex-col w-full h-full bg-primary-200">
      <h1>Type Racer</h1>
    </div>
  );
};

export default TypeRacerPage;
