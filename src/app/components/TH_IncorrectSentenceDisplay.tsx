"use client";
import React from "react";
import { GrammarQuestion } from "@/app/constants/index_treasurehunt";
import { getSentencePartsWithUnderline } from "@/lib/utils_treasurehunt";

const TH_IncorrectSentenceDisplay = ({
  currentQuestion,
}: {
  currentQuestion: GrammarQuestion;
}) => {
  return (
    <div className="text-center">
      <p className="text-xl font-bold text-gray-700 mb-4">
        ✏️ Type the full corrected sentence:
      </p>
      <div className="bg-red-100/50 backdrop-blur-sm p-6 rounded-2xl shadow-lg">
        <p className="text-2xl md:text-3xl font-bold text-red-700 leading-relaxed">
          {getSentencePartsWithUnderline(
            currentQuestion.incorrectSentence,
            currentQuestion.wordToUnderline
          ).map((part, index) =>
            part.shouldUnderline ? (
              <span
                key={index}
                className="underline decoration-red-500 decoration-2 underline-offset-2 animate-bounce"
              >
                {part.text}
              </span>
            ) : (
              <span key={index}>{part.text}</span>
            )
          )}
        </p>
      </div>
    </div>
  );
};

export default TH_IncorrectSentenceDisplay;
