# Treasure Hunt Minigame - Requirements Validation

## Overview
This document validates the user requirements for the Treasure Hunt minigame implementation against the current codebase state.

## Current Implementation Status

### ✅ Partially Implemented
1. **Visual Components (User Story 2.1)**
   - ✅ Finished screen component
   - ✅ Active gameplay screen
   - ❌ **Missing:** Setup screen for grade level selection
   - **Recommendation:** Create `TH_SetupScreen.tsx` component similar to `TQ_SetupScreen.tsx`

2. **Text Input Area (User Story 2.3)**
   - ✅ Input field exists for user entry
   - ⚠️ **Note:** Currently uses `<input type="text">` - consider `<textarea>` for multi-line sentences
   - **Status:** Functional but could be enhanced

3. **Sentence Matching Algorithm (User Story 2.6)**
   - ✅ Basic exact string matching implemented
   - ❌ **Missing:** Advanced matching (case-insensitive, whitespace normalization)
   - **Current:** `userInput.trim() === correctSentence`
   - **Recommendation:** Implement robust matching similar to `checkAnswer` in `utils_typequest.ts`

### ❌ Not Implemented
1. **Progress Bar (User Story 2.2)**
   - Currently only shows "Question X of Y" text
   - **Missing:** Visual progress bar component showing completion percentage
   - **Recommendation:** Add progress bar similar to TypeQuest visual patterns

2. **Grade Level Selection (System Requirement)**
   - ❌ No grade level selection screen
   - ❌ No grade-based difficulty system
   - **Current:** Hardcoded questions array
   - **Recommendation:** 
     - Create setup screen with grade selection (K, 1-2, 3-4, 5-6)
     - Store questions by grade in `index_treasurehunt.tsx`
     - Follow TypeQuest pattern

3. **Constants File Structure**
   - ❌ `index_treasurehunt.tsx` exists but contains TypeQuest types
   - **Current:** All types/questions defined in page component
   - **Recommendation:** 
     - Restructure `index_treasurehunt.tsx` with proper types
     - Add `GRAMMAR_QUESTIONS_BANK` organized by grade level
     - Define `GameState`, `GrammarQuestion`, `GradeLevel` types

4. **Tests (User Story 2.5)**
   - ❌ No unit tests
   - ❌ No acceptance tests
   - **Recommendation:** Create test files for:
     - Sentence matching algorithm
     - State transitions
     - Question validation logic

### ✅ Fully Implemented
1. **Display Incorrect Sentences (User Story 2.4)**
   - ✅ Incorrect sentences displayed prominently
   - ✅ Clear visual indication (red text)

## Requirements Breakdown

### User Story 2.1: Visual Components for Each Step
**Status:** ⚠️ **Partially Complete**
- ✅ Active screen with question display
- ✅ Finished screen with results
- ❌ Setup screen for grade selection needed
- **Action Items:**
  - Create `TH_SetupScreen.tsx` component
  - Implement grade level selection UI
  - Add game initialization flow

### User Story 2.2: Progress Bar
**Status:** ❌ **Not Implemented**
- Current: Text-only progress indicator
- **Action Items:**
  - Create visual progress bar component
  - Display completion percentage
  - Update progress bar on each question advancement

### User Story 2.3: Text Area for User Input
**Status:** ⚠️ **Partially Complete**
- ✅ Input field exists
- ⚠️ Should be textarea for longer sentences
- **Action Items:**
  - Convert `<input>` to `<textarea>`
  - Add proper sizing for multi-line sentences
  - Consider character count indicator

### User Story 2.4: Display Incorrect Sentences
**Status:** ✅ **Complete**
- ✅ Implemented correctly
- ✅ Clear visual presentation

### User Story 2.5: Acceptance and Unit Tests
**Status:** ❌ **Not Implemented**
- **Action Items:**
  - Create `__tests__/treasurehunt/` directory
  - Write unit tests for:
    - `validateGrammarSentence()` function
    - Sentence matching algorithm (exact, case-insensitive, normalized)
    - State transition logic
    - Question progression
  - Write acceptance tests for:
    - User can select grade level
    - User can enter correct sentence
    - Game advances on correct answer
    - Game shows feedback on incorrect answer
    - Progress bar updates correctly

### User Story 2.6: Sentence Matching Algorithm & State Transitions
**Status:** ⚠️ **Partially Complete**
- ✅ Basic exact matching works
- ❌ Missing: Case-insensitive matching
- ❌ Missing: Whitespace normalization
- ❌ Missing: Punctuation handling considerations
- **Action Items:**
  - Create `utils_treasurehunt.ts` with `validateGrammarSentence()` function
  - Implement robust matching algorithm
  - Handle edge cases (extra spaces, capitalization variations)
  - Test state transitions thoroughly

### System Requirement: Grade Level Selection
**Status:** ❌ **Not Implemented**
- **Action Items:**
  - Add grade level selection to setup flow
  - Create `GrammarQuestion` bank organized by grade:
    - `K`: Simple subject-verb agreement, basic punctuation
    - `1-2`: Basic grammar corrections, simple tenses
    - `3-4`: Intermediate grammar, complex sentences
    - `5-6`: Advanced grammar, nuanced corrections
  - Store in `index_treasurehunt.tsx` as `GRAMMAR_QUESTIONS_BANK`
  - Update game initialization to use selected grade level

## Architecture Recommendations

### File Structure
```
src/app/
├── components/
│   ├── TH_SetupScreen.tsx       ← NEW: Grade selection screen
│   ├── TH_ActiveScreen.tsx      ← REFACTOR: Extract active game logic
│   └── TH_FinishedScreen.tsx   ← REFACTOR: Extract finished screen
├── constants/
│   └── index_treasurehunt.tsx   ← RESTRUCTURE: Add types & question bank
└── (pages)/treasurehunt/
    └── page.tsx                  ← REFACTOR: Main game controller

src/lib/
└── utils_treasurehunt.ts         ← NEW: Validation & utility functions

__tests__/
└── treasurehunt/                ← NEW: Test suite
    ├── grammarValidation.test.ts
    ├── stateTransitions.test.ts
    └── components.test.tsx
```

### Type Definitions Needed
```typescript
// In index_treasurehunt.tsx
export type GradeLevel = "K" | "1-2" | "3-4" | "5-6";
export type GameStatus = "setup" | "active" | "finished";

export interface GrammarQuestion {
  id: string;
  incorrectSentence: string;
  correctSentence: string;
  gradeLevel: GradeLevel;
  grammarRule?: string; // Optional: "subject-verb agreement", "tense", etc.
}

export interface TreasureHuntGameState {
  gradeLevel: GradeLevel;
  status: GameStatus;
  currentQuestionIndex: number;
  questions: GrammarQuestion[];
  totalQuestions: number;
  score: number;
  mistakes: number;
  isGameFinished: boolean;
}
```

## Priority Implementation Order

1. **High Priority:**
   - Grade level selection (system requirement)
   - Constants file restructuring
   - Progress bar component
   - Enhanced sentence matching algorithm

2. **Medium Priority:**
   - Setup screen component
   - Textarea conversion
   - Component refactoring (extract screens)

3. **Lower Priority:**
   - Unit tests
   - Acceptance tests
   - Additional polish/UX improvements

## Validation Summary

| Requirement | Status | Notes |
|------------|--------|-------|
| 2.1 Visual Components | ⚠️ Partial | Missing setup screen |
| 2.2 Progress Bar | ❌ Missing | Needs implementation |
| 2.3 Text Area | ⚠️ Partial | Input exists, should be textarea |
| 2.4 Display Incorrect Sentences | ✅ Complete | Working well |
| 2.5 Tests | ❌ Missing | Need full test suite |
| 2.6 Matching Algorithm | ⚠️ Partial | Basic matching, needs enhancement |
| Grade Level Selection | ❌ Missing | Core system requirement |
| Constants Structure | ❌ Missing | Needs restructuring |

## Next Steps

1. ✅ **Validated** - Requirements understood and documented
2. 🔄 **Ready for Implementation** - Can proceed with:
   - Setting up constants structure
   - Creating grade level selection
   - Implementing progress bar
   - Enhancing validation logic
   - Writing tests

---
*Validation completed based on codebase analysis as of current state*
