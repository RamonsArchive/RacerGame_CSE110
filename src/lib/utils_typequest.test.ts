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
    it("should calculate game score with perfect game bonus and speed bonus", () => {
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
      const startTime = Date.now() - 5000; // 5 seconds ago (finished in 5s)
      const endTime = Date.now();
      const targetTimePerQuestion = 10; // Expected 10s per question
      const totalQuestions = 1;

      const score = calculateGameScore(
        questionResults,
        hadPerfectGame,
        startTime,
        endTime,
        targetTimePerQuestion,
        totalQuestions
      );

      // baseScore = 100
      // perfectBonus = 50
      // expectedTime = 10s, actualTime = 5s, timeSaved = 5s
      // speedBonus = 5 * 20 = 100
      // total = 100 + 50 + 100 = 250
      expect(score).toBe(250);
    });

    it("should calculate score without perfect game bonus but with speed bonus", () => {
      const questionResults: QuestionResult[] = [
        {
          questionId: "1",
          prompt: "test",
          userAnswer: "test",
          correctAnswer: "test",
          correct: true,
          timeSpent: 8,
          mistakes: 1,
          points: 90,
          timestamp: Date.now(),
        },
      ];

      const hadPerfectGame = false;
      const startTime = Date.now() - 8000; // 8 seconds ago (finished in 8s)
      const endTime = Date.now();
      const targetTimePerQuestion = 10; // Expected 10s per question
      const totalQuestions = 1;

      const score = calculateGameScore(
        questionResults,
        hadPerfectGame,
        startTime,
        endTime,
        targetTimePerQuestion,
        totalQuestions
      );

      // baseScore = 90
      // perfectBonus = 0 (had mistakes)
      // expectedTime = 10s, actualTime = 8s, timeSaved = 2s
      // speedBonus = 2 * 20 = 40
      // total = 90 + 0 + 40 = 130
      expect(score).toBe(130);
    });

    it("should calculate score without speed bonus when finished slower than target", () => {
      const questionResults: QuestionResult[] = [
        {
          questionId: "1",
          prompt: "test",
          userAnswer: "test",
          correctAnswer: "test",
          correct: true,
          timeSpent: 12,
          mistakes: 0,
          points: 100,
          timestamp: Date.now(),
        },
      ];

      const hadPerfectGame = true;
      const startTime = Date.now() - 12000; // 12 seconds ago (finished in 12s)
      const endTime = Date.now();
      const targetTimePerQuestion = 10; // Expected 10s per question
      const totalQuestions = 1;

      const score = calculateGameScore(
        questionResults,
        hadPerfectGame,
        startTime,
        endTime,
        targetTimePerQuestion,
        totalQuestions
      );

      // baseScore = 100
      // perfectBonus = 50
      // expectedTime = 10s, actualTime = 12s, timeSaved = -2s (negative, so no bonus)
      // speedBonus = 0
      // total = 100 + 50 + 0 = 150
      expect(score).toBe(150);
    });

    it("should calculate score for multiple questions correctly", () => {
      const questionResults: QuestionResult[] = [
        {
          questionId: "1",
          prompt: "test1",
          userAnswer: "test1",
          correctAnswer: "test1",
          correct: true,
          timeSpent: 5,
          mistakes: 0,
          points: 100,
          timestamp: Date.now(),
        },
        {
          questionId: "2",
          prompt: "test2",
          userAnswer: "test2",
          correctAnswer: "test2",
          correct: true,
          timeSpent: 6,
          mistakes: 0,
          points: 110,
          timestamp: Date.now(),
        },
      ];

      const hadPerfectGame = true;
      const startTime = Date.now() - 11000; // 11 seconds ago (finished in 11s)
      const endTime = Date.now();
      const targetTimePerQuestion = 10; // Expected 10s per question
      const totalQuestions = 2;

      const score = calculateGameScore(
        questionResults,
        hadPerfectGame,
        startTime,
        endTime,
        targetTimePerQuestion,
        totalQuestions
      );

      // baseScore = 100 + 110 = 210
      // perfectBonus = 50
      // expectedTime = 10 * 2 = 20s, actualTime = 11s, timeSaved = 9s
      // speedBonus = 9 * 20 = 180
      // total = 210 + 50 + 180 = 440
      expect(score).toBe(440);
    });

    it("should handle zero base score correctly", () => {
      const questionResults: QuestionResult[] = [
        {
          questionId: "1",
          prompt: "test",
          userAnswer: "wrong",
          correctAnswer: "test",
          correct: false,
          timeSpent: 15,
          mistakes: 5,
          points: 0,
          timestamp: Date.now(),
        },
      ];

      const hadPerfectGame = false;
      const startTime = Date.now() - 15000; // 15 seconds ago
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

      // baseScore = 0
      // perfectBonus = 0
      // expectedTime = 10s, actualTime = 15s, timeSaved = -5s (negative, so no bonus)
      // speedBonus = 0
      // total = 0 + 0 + 0 = 0
      expect(score).toBe(0);
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
