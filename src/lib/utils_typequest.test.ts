import { describe, it, expect } from "vitest";
import {
  calculateQuestionPoints,
  calculateGameScore,
  calculateAccuracy,
  calculateAverageTime,
  calculateCharactersPerSecond,
} from "./utils_typequest";
import { QuestionResult } from "@/app/constants/index_typequest";

describe("TypeQuest Utils", () => {
  describe("calculateQuestionPoints", () => {
    it("should calculate points correctly with speed bonus", () => {
      const timeInSeconds = 5; // Faster than target
      const mistakes = 0;
      const targetTime = 10;
      const basePoints = 100;

      const points = calculateQuestionPoints(
        timeInSeconds,
        mistakes,
        targetTime,
        basePoints
      );

      // Should get base points + speed bonus (5 seconds faster)
      expect(points).toBeGreaterThan(basePoints);
    });

    it("should apply mistake penalty", () => {
      const timeInSeconds = 10;
      const mistakes = 2; // should be 40 points less than base points
      const targetTime = 10;
      const basePoints = 100;

      const points = calculateQuestionPoints(
        timeInSeconds,
        mistakes,
        targetTime,
        basePoints
      );

      // Should be less than base points due to mistakes
      expect(points).toBe(basePoints - 40);
    });

    it("should return minimum 0 points", () => {
      const timeInSeconds = 20; // Slower than target
      const mistakes = 10; // Many mistakes
      const targetTime = 10;
      const basePoints = 100;

      const points = calculateQuestionPoints(
        timeInSeconds,
        mistakes,
        targetTime,
        basePoints
      );

      expect(points).toBeGreaterThanOrEqual(0);
    });
  });

  describe("calculateGameScore", () => {
    it("should calculate game score with perfect game bonus", () => {
      const questionResults: QuestionResult[] = [
        {
          questionId: "1",
          prompt: "test",
          userAnswer: "test",
          correctAnswer: "test",
          correct: true,
          timeSpent: 5,
          mistakes: 0,
          points: 100,
          timestamp: Date.now(),
        },
      ];

      const hadPerfectGame = true;
      const startTime = Date.now() - 10000; // 10 seconds ago
      const endTime = Date.now();
      const targetTimePerQuestion = 10;
      const totalQuestions = 1;

      const score = calculateGameScore(
        questionResults,
        hadPerfectGame,
        startTime,
        endTime,
        targetTimePerQuestion,
        totalQuestions
      );

      expect(score).toBeGreaterThan(100); // Should include perfect bonus
    });

    it("should calculate score without perfect game bonus", () => {
      const questionResults: QuestionResult[] = [
        {
          questionId: "1",
          prompt: "test",
          userAnswer: "test",
          correctAnswer: "test",
          correct: true,
          timeSpent: 5,
          mistakes: 1,
          points: 90,
          timestamp: Date.now(),
        },
      ];

      const hadPerfectGame = false;
      const startTime = Date.now() - 10000;
      const endTime = Date.now();
      const targetTimePerQuestion = 10;
      const totalQuestions = 1;

      const score = calculateGameScore(
        questionResults,
        hadPerfectGame,
        startTime,
        endTime,
        targetTimePerQuestion,
        totalQuestions
      );

      expect(score).toBeGreaterThanOrEqual(90);
      expect(score).toBeLessThan(200); // No perfect bonus
    });
  });

  describe("calculateAccuracy", () => {
    it("should calculate 100% accuracy for all correct", () => {
      const correct = 10;
      const total = 10;
      const accuracy = calculateAccuracy(correct, total);
      expect(accuracy).toBe(100);
    });

    it("should calculate 50% accuracy for half correct", () => {
      const correct = 5;
      const total = 10;
      const accuracy = calculateAccuracy(correct, total);
      expect(accuracy).toBe(50);
    });

    it("should handle zero total questions", () => {
      const correct = 0;
      const total = 0;
      const accuracy = calculateAccuracy(correct, total);
      // When total is 0, function returns 100 (perfect score by default)
      expect(accuracy).toBe(100);
    });
  });

  describe("calculateAverageTime", () => {
    it("should calculate average time correctly", () => {
      const totalTime = 100; // seconds
      const questionCount = 10;
      const avgTime = calculateAverageTime(totalTime, questionCount);
      expect(avgTime).toBe(10);
    });

    it("should return 0 for zero questions", () => {
      const totalTime = 100;
      const questionCount = 0;
      const avgTime = calculateAverageTime(totalTime, questionCount);
      expect(avgTime).toBe(0);
    });
  });

  describe("calculateCharactersPerSecond", () => {
    it("should calculate characters per second correctly", () => {
      const totalCharacters = 100;
      const totalTime = 10; // seconds
      const cps = calculateCharactersPerSecond(totalCharacters, totalTime);
      expect(cps).toBe(10);
    });

    it("should handle zero time", () => {
      const totalCharacters = 100;
      const totalTime = 0;
      const cps = calculateCharactersPerSecond(totalCharacters, totalTime);
      expect(cps).toBe(0);
    });
  });
});

