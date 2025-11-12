import { describe, it, expect } from "vitest";
import {
  calculateQuestionPoints,
  calculateGameScore,
  calculateAccuracy,
  calculateAverageTime,
} from "./utils_treasurehunt";
import { QuestionResult, GAME_CONFIG } from "@/app/constants/index_treasurehunt";

describe("TreasureHunt Utils", () => {
  describe("calculateQuestionPoints", () => {
    it("should calculate points correctly with speed bonus", () => {
      const timeInSeconds = 5; // Faster than target
      const mistakes = 0;
      const targetTime = 10;
      const basePoints = GAME_CONFIG.BASE_POINTS;

      const expectedSpeedBonus = Math.round((targetTime - timeInSeconds) * GAME_CONFIG.SPEED_BONUS_MULTIPLIER);
      const expected = Math.max(0, basePoints + expectedSpeedBonus - mistakes * GAME_CONFIG.MISTAKE_PENALTY);

      const points = calculateQuestionPoints(
        timeInSeconds,
        mistakes,
        targetTime,
        basePoints
      );

      expect(points).toBe(expected);
    });

    it("should apply mistake penalty", () => {
      const timeInSeconds = 10;
      const mistakes = 2;
      const targetTime = 10;
      const basePoints = GAME_CONFIG.BASE_POINTS;

      const expectedSpeedBonus = Math.round((targetTime - timeInSeconds) * GAME_CONFIG.SPEED_BONUS_MULTIPLIER);
      const expected = Math.max(0, basePoints + expectedSpeedBonus - mistakes * GAME_CONFIG.MISTAKE_PENALTY);

      const points = calculateQuestionPoints(
        timeInSeconds,
        mistakes,
        targetTime,
        basePoints
      );

      expect(points).toBe(expected);
    });

    it("should return minimum 0 points", () => {
      const timeInSeconds = 20; // Slower than target
      const mistakes = 100; // Many mistakes to drive points negative
      const targetTime = 10;
      const basePoints = GAME_CONFIG.BASE_POINTS;

      const expectedSpeedBonus = Math.round((targetTime - timeInSeconds) * GAME_CONFIG.SPEED_BONUS_MULTIPLIER);
      const expected = Math.max(0, basePoints + expectedSpeedBonus - mistakes * GAME_CONFIG.MISTAKE_PENALTY);

      const points = calculateQuestionPoints(
        timeInSeconds,
        mistakes,
        targetTime,
        basePoints
      );

      expect(points).toBeGreaterThanOrEqual(expected);
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
          points: GAME_CONFIG.BASE_POINTS,
          timestamp: Date.now(),
        },
      ];

      const hadPerfectGame = true;
      const startTime = Date.now() - 5000; // 5 seconds ago (finished in 5s)
      const endTime = Date.now();
      const targetTimePerQuestion = 10; // Expected 10s per question
      const totalQuestions = 1;

      const baseScore = questionResults.reduce((t, q) => t + q.points, 0);
      const perfectBonus = hadPerfectGame ? GAME_CONFIG.PERFECT_BONUS : 0;
      const actualTime = (endTime - startTime) / 1000;
      const expectedTime = targetTimePerQuestion * totalQuestions;
      const timeSaved = expectedTime - actualTime;
      const speedBonus = timeSaved > 0 ? Math.round(timeSaved * GAME_CONFIG.SPEED_BONUS_MULTIPLIER) : 0;
      const expected = baseScore + perfectBonus + speedBonus;

      const score = calculateGameScore(
        questionResults,
        hadPerfectGame,
        startTime,
        endTime,
        targetTimePerQuestion,
        totalQuestions
      );

      expect(score).toBe(expected);
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
          points: GAME_CONFIG.BASE_POINTS - GAME_CONFIG.MISTAKE_PENALTY,
          timestamp: Date.now(),
        },
      ];

      const hadPerfectGame = false;
      const startTime = Date.now() - 8000; // 8 seconds ago (finished in 8s)
      const endTime = Date.now();
      const targetTimePerQuestion = 10; // Expected 10s per question
      const totalQuestions = 1;

      const baseScore = questionResults.reduce((t, q) => t + q.points, 0);
      const perfectBonus = hadPerfectGame ? GAME_CONFIG.PERFECT_BONUS : 0;
      const actualTime = (endTime - startTime) / 1000;
      const expectedTime = targetTimePerQuestion * totalQuestions;
      const timeSaved = expectedTime - actualTime;
      const speedBonus = timeSaved > 0 ? Math.round(timeSaved * GAME_CONFIG.SPEED_BONUS_MULTIPLIER) : 0;
      const expected = baseScore + perfectBonus + speedBonus;

      const score = calculateGameScore(
        questionResults,
        hadPerfectGame,
        startTime,
        endTime,
        targetTimePerQuestion,
        totalQuestions
      );

      expect(score).toBe(expected);
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
          points: GAME_CONFIG.BASE_POINTS,
          timestamp: Date.now(),
        },
      ];

      const hadPerfectGame = true;
      const startTime = Date.now() - 12000; // 12 seconds ago (finished in 12s)
      const endTime = Date.now();
      const targetTimePerQuestion = 10; // Expected 10s per question
      const totalQuestions = 1;

      const baseScore = questionResults.reduce((t, q) => t + q.points, 0);
      const perfectBonus = hadPerfectGame ? GAME_CONFIG.PERFECT_BONUS : 0;
      const actualTime = (endTime - startTime) / 1000;
      const expectedTime = targetTimePerQuestion * totalQuestions;
      const timeSaved = expectedTime - actualTime;
      const speedBonus = timeSaved > 0 ? Math.round(timeSaved * GAME_CONFIG.SPEED_BONUS_MULTIPLIER) : 0;
      const expected = baseScore + perfectBonus + speedBonus;

      const score = calculateGameScore(
        questionResults,
        hadPerfectGame,
        startTime,
        endTime,
        targetTimePerQuestion,
        totalQuestions
      );

      expect(score).toBe(expected);
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
          points: GAME_CONFIG.BASE_POINTS,
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
          points: GAME_CONFIG.BASE_POINTS + 10,
          timestamp: Date.now(),
        },
      ];

      const hadPerfectGame = true;
      const startTime = Date.now() - 11000; // 11 seconds ago (finished in 11s)
      const endTime = Date.now();
      const targetTimePerQuestion = 10; // Expected 10s per question
      const totalQuestions = 2;

      const baseScore = questionResults.reduce((t, q) => t + q.points, 0);
      const perfectBonus = hadPerfectGame ? GAME_CONFIG.PERFECT_BONUS : 0;
      const actualTime = (endTime - startTime) / 1000;
      const expectedTime = targetTimePerQuestion * totalQuestions;
      const timeSaved = expectedTime - actualTime;
      const speedBonus = timeSaved > 0 ? Math.round(timeSaved * GAME_CONFIG.SPEED_BONUS_MULTIPLIER) : 0;
      const expected = baseScore + perfectBonus + speedBonus;

      const score = calculateGameScore(
        questionResults,
        hadPerfectGame,
        startTime,
        endTime,
        targetTimePerQuestion,
        totalQuestions
      );

      expect(score).toBe(expected);
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

      const baseScore = questionResults.reduce((t, q) => t + q.points, 0);
      const perfectBonus = hadPerfectGame ? GAME_CONFIG.PERFECT_BONUS : 0;
      const actualTime = (endTime - startTime) / 1000;
      const expectedTime = targetTimePerQuestion * totalQuestions;
      const timeSaved = expectedTime - actualTime;
      const speedBonus = timeSaved > 0 ? Math.round(timeSaved * GAME_CONFIG.SPEED_BONUS_MULTIPLIER) : 0;
      const expected = baseScore + perfectBonus + speedBonus;

      const score = calculateGameScore(
        questionResults,
        hadPerfectGame,
        startTime,
        endTime,
        targetTimePerQuestion,
        totalQuestions
      );

      expect(score).toBe(expected);
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
});
