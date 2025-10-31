// constants/index_treasurehunt.tsx

export type GradeLevel = "K" | "1-2" | "3-4" | "5-6";
export type GameStatus = "setup" | "active" | "finished";

export const GRADE_LEVEL_LABELS: Record<GradeLevel, string> = {
  K: "Kindergarten",
  "1-2": "Grades 1-2",
  "3-4": "Grades 3-4",
  "5-6": "Grades 5-6",
};

export const GRADE_LEVEL_DESCRIPTIONS: Record<GradeLevel, string> = {
  K: "Simple subject-verb agreement and basic punctuation",
  "1-2": "Basic grammar corrections and simple tenses",
  "3-4": "Intermediate grammar and complex sentences",
  "5-6": "Advanced grammar and nuanced corrections",
};

export interface GrammarQuestion {
  id: string;
  incorrectSentence: string;
  correctSentence: string | string[];
  gradeLevel: GradeLevel;
  grammarRule?: string; // e.g., "subject-verb agreement", "tense", "punctuation"
  hint?: string; // Helpful hint for the user
}

export interface QuestionProgress {
  questionId: string;
  mistakes: number;
  hintShown: boolean;
  gaveUp: boolean;
}

export interface TreasureHuntGameState {
  gameId: string;
  gradeLevel: GradeLevel;
  status: GameStatus;
  currentQuestionIndex: number;
  questions: GrammarQuestion[];
  totalQuestions: number;
  score: number;
  mistakes: number;
  isGameFinished: boolean;
  startTime: number | null;
  endTime: number | null;
  questionProgress: QuestionProgress[]; // Track hints/give ups per question
  answerLog: AnswerLogEntry[]; // Track incorrect attempts for results
}

export interface AnswerLogEntry {
  questionId: string;
  prompt: string; // the incorrect sentence shown
  userAnswer: string;
  correctAnswer: string | string[];
  gaveUp?: boolean;
}

export interface GameResult {
  gameId: string;
  date: number;
  gradeLevel: GradeLevel;
  totalQuestions: number;
  score: number;
  mistakes: number;
  totalTime: number;
  accuracy: number; // percentage
}

// Game configuration
export const GAME_CONFIG = {
  DEFAULT_QUESTIONS: 10,
  MIN_QUESTIONS: 5,
  MAX_QUESTIONS: 15,
  SESSION_STORAGE_KEY: "treasurehunt_game_state",
  HINT_MISTAKE_THRESHOLD: 1, // Show hint after first mistake
  GIVE_UP_MISTAKE_THRESHOLD: 3, // Show give up after 3 mistakes
} as const;

// Grammar questions bank organized by grade level
export const GRAMMAR_QUESTIONS_BANK: Record<GradeLevel, GrammarQuestion[]> = {
  K: [
    {
      id: "k-1",
      incorrectSentence: "The dog are running in the park.",
      correctSentence: "The dog is running in the park.",
      gradeLevel: "K",
      grammarRule: "subject-verb agreement",
      hint: "Remember: one dog (singular) uses 'is', not 'are'",
    },
    {
      id: "k-2",
      incorrectSentence: "I like apple.",
      correctSentence: "I like apples.",
      gradeLevel: "K",
      grammarRule: "pluralization",
      hint: "When you like more than one, add an 's' at the end",
    },
    {
      id: "k-3",
      incorrectSentence: "the cat is sleeping.",
      correctSentence: "The cat is sleeping.",
      gradeLevel: "K",
      grammarRule: "capitalization",
      hint: "The first word of a sentence always starts with a capital letter",
    },
    {
      id: "k-4",
      incorrectSentence: "She have a toy.",
      correctSentence: "She has a toy.",
      gradeLevel: "K",
      grammarRule: "subject-verb agreement",
      hint: "When we talk about 'she', we use 'has', not 'have'",
    },
    {
      id: "k-5",
      incorrectSentence: "we play outside.",
      correctSentence: "We play outside.",
      gradeLevel: "K",
      grammarRule: "capitalization",
      hint: "The first word of every sentence needs a capital letter",
    },
    {
      id: "k-6",
      incorrectSentence: "The cat are sleeping.",
      correctSentence: "The cat is sleeping.",
      gradeLevel: "K",
      grammarRule: "subject-verb agreement",
      hint: "One cat (singular) needs 'is', not 'are'",
    },
    {
      id: "k-7",
      incorrectSentence: "I see three cat.",
      correctSentence: "I see three cats.",
      gradeLevel: "K",
      grammarRule: "pluralization",
      hint: "When you have three or more, add an 's' to make it plural",
    },
    {
      id: "k-8",
      incorrectSentence: "he like cookies.",
      correctSentence: "He likes cookies.",
      gradeLevel: "K",
      grammarRule: "third person singular",
      hint: "When 'he' does something, add an 's' to the action word",
    },
    {
      id: "k-9",
      incorrectSentence: "the sun is bright.",
      correctSentence: "The sun is bright.",
      gradeLevel: "K",
      grammarRule: "capitalization",
      hint: "Always start a sentence with a capital letter",
    },
    {
      id: "k-10",
      incorrectSentence: "I have two ball.",
      correctSentence: "I have two balls.",
      gradeLevel: "K",
      grammarRule: "pluralization",
      hint: "When you have two or more, add 's' to make it plural",
    },
    {
      id: "k-11",
      incorrectSentence: "she go to school.",
      correctSentence: "She goes to school.",
      gradeLevel: "K",
      grammarRule: "third person singular",
      hint: "When 'she' does something, add 's' or 'es' to the action word",
    },
    {
      id: "k-12",
      incorrectSentence: "they is happy.",
      correctSentence: "They are happy.",
      gradeLevel: "K",
      grammarRule: "subject-verb agreement",
      hint: "'They' means more than one, so use 'are' not 'is'",
    },
    {
      id: "k-13",
      incorrectSentence: "mom made cookie.",
      correctSentence: "Mom made cookies.",
      gradeLevel: "K",
      grammarRule: "capitalization and pluralization",
      hint: "Names like 'Mom' start with capitals, and check if you need 's' for plural",
    },
    {
      id: "k-14",
      incorrectSentence: "i see a bird.",
      correctSentence: "I see a bird.",
      gradeLevel: "K",
      grammarRule: "capitalization",
      hint: "The word 'I' is always a capital letter, even in the middle",
    },
    {
      id: "k-15",
      incorrectSentence: "He have a bike.",
      correctSentence: "He has a bike.",
      gradeLevel: "K",
      grammarRule: "subject-verb agreement",
      hint: "When talking about 'he', use 'has' not 'have'",
    },
  ],

  "1-2": [
    {
      id: "12-1",
      incorrectSentence: "She don't like to eat vegetables.",
      correctSentence: "She doesn't like to eat vegetables.",
      gradeLevel: "1-2",
      grammarRule: "subject-verb agreement with contractions",
      hint: "When talking about 'she', use 'doesn't' not 'don't'",
    },
    {
      id: "12-2",
      incorrectSentence: "The books was on the table.",
      correctSentence: "The books were on the table.",
      gradeLevel: "1-2",
      grammarRule: "subject-verb agreement",
      hint: "'Books' is plural (more than one), so use 'were' not 'was'",
    },
    {
      id: "12-3",
      incorrectSentence: "He can't hardly see the board.",
      correctSentence: "He can hardly see the board.",
      gradeLevel: "1-2",
      grammarRule: "double negative",
      hint: "Can't and hardly are both negative words - you only need one!",
    },
    {
      id: "12-4",
      incorrectSentence: "They was playing in the yard.",
      correctSentence: "They were playing in the yard.",
      gradeLevel: "1-2",
      grammarRule: "subject-verb agreement",
      hint: "'They' means more than one person, so use 'were' not 'was'",
    },
    {
      id: "12-5",
      incorrectSentence: "I go to the store yesterday.",
      correctSentence: "I went to the store yesterday.",
      gradeLevel: "1-2",
      grammarRule: "past tense",
      hint: "'Yesterday' means it already happened, so use the past tense 'went'",
    },
    {
      id: "12-6",
      incorrectSentence: "She write a letter every day.",
      correctSentence: "She writes a letter every day.",
      gradeLevel: "1-2",
      grammarRule: "third person singular",
      hint: "When 'she' does something, add 's' to the action word",
    },
    {
      id: "12-7",
      incorrectSentence: "We was happy to see you.",
      correctSentence: "We were happy to see you.",
      gradeLevel: "1-2",
      grammarRule: "subject-verb agreement",
      hint: "'We' means more than one, so use 'were' not 'was'",
    },
    {
      id: "12-8",
      incorrectSentence: "The dog and the cat is playing.",
      correctSentence: "The dog and the cat are playing.",
      gradeLevel: "1-2",
      grammarRule: "subject-verb agreement with compound subjects",
      hint: "When you have two things (dog AND cat), use 'are' not 'is'",
    },
    {
      id: "12-9",
      incorrectSentence: "She don't want to go.",
      correctSentence: "She doesn't want to go.",
      gradeLevel: "1-2",
      grammarRule: "subject-verb agreement with contractions",
      hint: "When 'she' doesn't do something, use 'doesn't' not 'don't'",
    },
    {
      id: "12-10",
      incorrectSentence: "I have went to the park.",
      correctSentence: "I went to the park.",
      gradeLevel: "1-2",
      grammarRule: "past tense",
      hint: "Use 'went' for something that happened in the past - you don't need 'have'",
    },
    {
      id: "12-11",
      incorrectSentence: "He don't know how to swim.",
      correctSentence: "He doesn't know how to swim.",
      gradeLevel: "1-2",
      grammarRule: "subject-verb agreement with contractions",
      hint: "When 'he' doesn't do something, use 'doesn't' not 'don't'",
    },
    {
      id: "12-12",
      incorrectSentence: "The flowers was beautiful.",
      correctSentence: "The flowers were beautiful.",
      gradeLevel: "1-2",
      grammarRule: "subject-verb agreement",
      hint: "More than one flower means use 'were' not 'was'",
    },
    {
      id: "12-13",
      incorrectSentence: "I run to school every day.",
      correctSentence: "I ran to school every day.",
      gradeLevel: "1-2",
      grammarRule: "past tense",
      hint: "If it already happened, use the past tense form",
    },
    {
      id: "12-14",
      incorrectSentence: "She eat an apple.",
      correctSentence: "She eats an apple.",
      gradeLevel: "1-2",
      grammarRule: "third person singular",
      hint: "When 'she' does something, add 's' or 'es' to the action word",
    },
    {
      id: "12-15",
      incorrectSentence: "They was excited about the trip.",
      correctSentence: "They were excited about the trip.",
      gradeLevel: "1-2",
      grammarRule: "subject-verb agreement",
      hint: "'They' means more than one person, use 'were'",
    },
    {
      id: "12-16",
      incorrectSentence: "The bird and the bee is flying.",
      correctSentence: "The bird and the bee are flying.",
      gradeLevel: "1-2",
      grammarRule: "subject-verb agreement with compound subjects",
      hint: "Two things (bird AND bee) need 'are' not 'is'",
    },
    {
      id: "12-17",
      incorrectSentence: "He don't like broccoli.",
      correctSentence: "He doesn't like broccoli.",
      gradeLevel: "1-2",
      grammarRule: "subject-verb agreement with contractions",
      hint: "For 'he', use 'doesn't' not 'don't'",
    },
    {
      id: "12-18",
      incorrectSentence: "I see that movie last week.",
      correctSentence: "I saw that movie last week.",
      gradeLevel: "1-2",
      grammarRule: "past tense",
      hint: "'Last week' means it already happened, use 'saw' (past of 'see')",
    },
    {
      id: "12-19",
      incorrectSentence: "We was going to the park.",
      correctSentence: "We were going to the park.",
      gradeLevel: "1-2",
      grammarRule: "subject-verb agreement",
      hint: "'We' is plural, use 'were' not 'was'",
    },
    {
      id: "12-20",
      incorrectSentence: "She make cookies every weekend.",
      correctSentence: "She makes cookies every weekend.",
      gradeLevel: "1-2",
      grammarRule: "third person singular",
      hint: "When 'she' does something regularly, add 's' to the action word",
    },
  ],

  "3-4": [
    {
      id: "34-1",
      incorrectSentence: "I have went to the store yesterday.",
      correctSentence: "I went to the store yesterday.",
      gradeLevel: "3-4",
      grammarRule: "past tense vs. past participle",
      hint: "Use 'went' (simple past) when you mention a specific time like 'yesterday'",
    },
    {
      id: "34-2",
      incorrectSentence: "The children was playing outside.",
      correctSentence: "The children were playing outside.",
      gradeLevel: "3-4",
      grammarRule: "subject-verb agreement with plural nouns",
      hint: "'Children' is plural (more than one), so use 'were' not 'was'",
    },
    {
      id: "34-3",
      incorrectSentence: "She done her homework.",
      correctSentence: "She did her homework.",
      gradeLevel: "3-4",
      grammarRule: "past tense irregular verbs",
      hint: "The past tense of 'do' is 'did', not 'done'. 'Done' needs a helper word like 'has'",
    },
    {
      id: "34-4",
      incorrectSentence: "He don't know the answer.",
      correctSentence: "He doesn't know the answer.",
      gradeLevel: "3-4",
      grammarRule: "subject-verb agreement",
      hint: "For 'he', use 'doesn't' not 'don't'",
    },
    {
      id: "34-5",
      incorrectSentence: "The team was excited about they're victory.",
      correctSentence: "The team was excited about their victory.",
      gradeLevel: "3-4",
      grammarRule: "homophones (their vs. they're)",
      hint: "'Their' means it belongs to them. 'They're' means 'they are'",
    },
    {
      id: "34-6",
      incorrectSentence: "I seen that movie already.",
      correctSentence: "I have seen that movie already.",
      gradeLevel: "3-4",
      grammarRule: "present perfect tense",
      hint: "When talking about something completed in the past with no specific time, use 'have seen'",
    },
    {
      id: "34-7",
      incorrectSentence: "Each of the students have a book.",
      correctSentence: "Each of the students has a book.",
      gradeLevel: "3-4",
      grammarRule: "subject-verb agreement with 'each'",
      hint: "'Each' is singular, so use 'has' not 'have' even if it's about multiple students",
    },
    {
      id: "34-8",
      incorrectSentence: "Neither the cat nor the dog were hungry.",
      correctSentence: "Neither the cat nor the dog was hungry.",
      gradeLevel: "3-4",
      grammarRule: "subject-verb agreement with 'neither/nor'",
      hint: "With 'neither/nor', match the verb to the subject closest to it (the dog - singular)",
    },
    {
      id: "34-9",
      incorrectSentence: "The teacher, along with the students, were happy.",
      correctSentence: "The teacher, along with the students, was happy.",
      gradeLevel: "3-4",
      grammarRule: "subject-verb agreement with intervening phrases",
      hint: "The main subject is 'teacher' (singular), so use 'was'. The part after the comma doesn't change it",
    },
    {
      id: "34-10",
      incorrectSentence: "I could of done better.",
      correctSentence: "I could have done better.",
      gradeLevel: "3-4",
      grammarRule: "could have vs. could of",
      hint: "Always use 'could have', never 'could of'. 'Of' is a preposition, not part of a verb",
    },
    {
      id: "34-11",
      incorrectSentence: "The group of kids was playing.",
      correctSentence: "The group of kids were playing.",
      gradeLevel: "3-4",
      grammarRule: "subject-verb agreement with collective nouns",
      hint: "When focusing on the individuals (kids), use plural 'were'",
    },
    {
      id: "34-12",
      incorrectSentence: "Everyone were excited.",
      correctSentence: "Everyone was excited.",
      gradeLevel: "3-4",
      grammarRule: "subject-verb agreement with indefinite pronouns",
      hint: "'Everyone' is singular even though it means many people, so use 'was'",
    },
    {
      id: "34-13",
      incorrectSentence: "I should of studied more.",
      correctSentence: "I should have studied more.",
      gradeLevel: "3-4",
      grammarRule: "should have vs. should of",
      hint: "Always use 'should have', never 'should of'",
    },
    {
      id: "34-14",
      incorrectSentence: "There was many people at the party.",
      correctSentence: "There were many people at the party.",
      gradeLevel: "3-4",
      grammarRule: "subject-verb agreement with 'there is/are'",
      hint: "Match the verb to what comes after - 'many people' (plural) needs 'were'",
    },
    {
      id: "34-15",
      incorrectSentence: "One of the books were missing.",
      correctSentence: "One of the books was missing.",
      gradeLevel: "3-4",
      grammarRule: "subject-verb agreement with 'one of'",
      hint: "'One' is the subject (singular), so use 'was' even though 'books' is plural",
    },
    {
      id: "34-16",
      incorrectSentence: "Either the cat or the dogs was sleeping.",
      correctSentence: "Either the cat or the dogs were sleeping.",
      gradeLevel: "3-4",
      grammarRule: "subject-verb agreement with 'either/or'",
      hint: "With 'either/or', match the verb to the subject closest to it (dogs - plural)",
    },
    {
      id: "34-17",
      incorrectSentence: "The class were taking a test.",
      correctSentence: "The class was taking a test.",
      gradeLevel: "3-4",
      grammarRule: "subject-verb agreement with collective nouns",
      hint: "'Class' as a group is singular, so use 'was'",
    },
    {
      id: "34-18",
      incorrectSentence: "I should of known better.",
      correctSentence: "I should have known better.",
      gradeLevel: "3-4",
      grammarRule: "should have vs. should of",
      hint: "Never use 'should of' - always use 'should have'",
    },
    {
      id: "34-19",
      incorrectSentence: "Your and my book is on the table.",
      correctSentence: "Your book and my book are on the table.",
      gradeLevel: "3-4",
      grammarRule: "possessive pronouns agreement",
      hint: "When you have two separate things, each needs its own noun",
    },
    {
      id: "34-20",
      incorrectSentence: "Me and my friend went shopping.",
      correctSentence: "My friend and I went shopping.",
      gradeLevel: "3-4",
      grammarRule: "pronoun case",
      hint: "Use 'I' when it's the subject of the sentence. Put others first as a courtesy",
    },
  ],

  "5-6": [
    {
      id: "56-1",
      incorrectSentence: "The data shows that the hypothesis is correct.",
      correctSentence: "The data show that the hypothesis is correct.",
      gradeLevel: "5-6",
      grammarRule: "subject-verb agreement with collective nouns",
      hint: "'Data' is actually plural (the singular is 'datum'), so use 'show' not 'shows'",
    },
    {
      id: "56-2",
      incorrectSentence: "If I was you, I would study harder.",
      correctSentence: "If I were you, I would study harder.",
      gradeLevel: "5-6",
      grammarRule: "subjunctive mood",
      hint: "In hypothetical situations (like 'if I were you'), use 'were' not 'was'",
    },
    {
      id: "56-3",
      incorrectSentence: "Me and my friend went to the store.",
      correctSentence: "My friend and I went to the store.",
      gradeLevel: "5-6",
      grammarRule: "pronoun case",
      hint: "Use 'I' when it's the subject. Put others first as a courtesy",
    },
    {
      id: "56-4",
      incorrectSentence: "The teacher gave the assignment to Sarah and I.",
      correctSentence: "The teacher gave the assignment to Sarah and me.",
      gradeLevel: "5-6",
      grammarRule: "pronoun case in prepositional phrases",
      hint: "After 'to' (a preposition), use 'me' not 'I'. Try saying it without 'Sarah' to check",
    },
    {
      id: "56-5",
      incorrectSentence: "Everyone should bring their book.",
      correctSentence: "Everyone should bring his or her book.",
      gradeLevel: "5-6",
      grammarRule: "pronoun-antecedent agreement",
      hint: "'Everyone' is singular, so use 'his or her' not 'their'",
    },
    {
      id: "56-6",
      incorrectSentence: "The team won their first game.",
      correctSentence: "The team won its first game.",
      gradeLevel: "5-6",
      grammarRule: "pronoun-antecedent agreement with collective nouns",
      hint: "'Team' is singular, so use 'its' not 'their'",
    },
    {
      id: "56-7",
      incorrectSentence: "She is taller then me.",
      correctSentence: "She is taller than me.",
      gradeLevel: "5-6",
      grammarRule: "than vs. then",
      hint: "'Than' is for comparisons (taller than). 'Then' is for time (first, then second)",
    },
    {
      id: "56-8",
      incorrectSentence: "Its a beautiful day outside.",
      correctSentence: "It's a beautiful day outside.",
      gradeLevel: "5-6",
      grammarRule: "its vs. it's",
      hint: "'It's' means 'it is' (with apostrophe). 'Its' means 'belongs to it' (no apostrophe)",
    },
    {
      id: "56-9",
      incorrectSentence: "The effect of the medicine were immediate.",
      correctSentence: "The effect of the medicine was immediate.",
      gradeLevel: "5-6",
      grammarRule: "subject-verb agreement with intervening phrases",
      hint: "The subject is 'effect' (singular), so use 'was' even though 'medicine' comes after",
    },
    {
      id: "56-10",
      incorrectSentence: "Between you and I, this is a secret.",
      correctSentence: "Between you and me, this is a secret.",
      gradeLevel: "5-6",
      grammarRule: "pronoun case with prepositions",
      hint: "After a preposition like 'between', use 'me' not 'I'",
    },
    {
      id: "56-11",
      incorrectSentence: "The committee were divided.",
      correctSentence: "The committee was divided.",
      gradeLevel: "5-6",
      grammarRule: "subject-verb agreement with collective nouns",
      hint: "'Committee' as a group is singular, so use 'was'",
    },
    {
      id: "56-12",
      incorrectSentence: "Whom should I give this to?",
      correctSentence: "Who should I give this to?",
      gradeLevel: "5-6",
      grammarRule: "who vs. whom",
      hint: "Use 'who' when it's the subject of the sentence (even if it comes at the end)",
    },
    {
      id: "56-13",
      incorrectSentence: "I wish I was taller.",
      correctSentence: "I wish I were taller.",
      gradeLevel: "5-6",
      grammarRule: "subjunctive mood",
      hint: "In wishes (unreal situations), use 'were' not 'was'",
    },
    {
      id: "56-14",
      incorrectSentence: "The impact of the changes were significant.",
      correctSentence: "The impact of the changes was significant.",
      gradeLevel: "5-6",
      grammarRule: "subject-verb agreement with intervening phrases",
      hint: "The subject is 'impact' (singular), so use 'was'",
    },
    {
      id: "56-15",
      incorrectSentence: "She is better at math then me.",
      correctSentence: "She is better at math than me.",
      gradeLevel: "5-6",
      grammarRule: "than vs. then",
      hint: "Use 'than' for comparisons, 'then' for time",
    },
    {
      id: "56-16",
      incorrectSentence: "The jury were deliberating.",
      correctSentence: "The jury was deliberating.",
      gradeLevel: "5-6",
      grammarRule: "subject-verb agreement with collective nouns",
      hint: "'Jury' as a group is singular, so use 'was'",
    },
    {
      id: "56-17",
      incorrectSentence: "Neither the students nor the teacher were ready.",
      correctSentence: "Neither the students nor the teacher was ready.",
      gradeLevel: "5-6",
      grammarRule: "subject-verb agreement with 'neither/nor'",
      hint: "With 'neither/nor', match the verb to the subject closest to it (teacher - singular)",
    },
    {
      id: "56-18",
      incorrectSentence: "The reason is because I was tired.",
      correctSentence: "The reason is that I was tired.",
      gradeLevel: "5-6",
      grammarRule: "reason is because vs. reason is that",
      hint: "Use 'the reason is that' not 'the reason is because' (it's redundant)",
    },
    {
      id: "56-19",
      incorrectSentence: "The number of students were increasing.",
      correctSentence: "The number of students was increasing.",
      gradeLevel: "5-6",
      grammarRule: "subject-verb agreement with 'number of'",
      hint: "'The number' is singular, so use 'was'",
    },
    {
      id: "56-20",
      incorrectSentence: "A number of students was absent.",
      correctSentence: "A number of students were absent.",
      gradeLevel: "5-6",
      grammarRule: "subject-verb agreement with 'a number of'",
      hint: "'A number of' means 'many', so use plural 'were'",
    },
  ],
};

// Helper function to get random questions for a grade level
export const getRandomGrammarQuestions = (
  gradeLevel: GradeLevel,
  count: number
): GrammarQuestion[] => {
  const pool = [...GRAMMAR_QUESTIONS_BANK[gradeLevel]];
  // Shuffle array
  const shuffled = pool.sort(() => Math.random() - 0.5);
  // Return requested count
  return shuffled.slice(0, Math.min(count, pool.length));
};
