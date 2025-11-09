import { GameType } from "@/lib/GlobalTypes";

export const GAMES: GameType[] = [
  {
    id: "typequest",
    title: "Type Quest",
    description:
      "Race against the clock to type as many gramatically correct words as possible.",
    image_path: "/Assets/TypeQuest/typeracer.png",
    href: "/typequest",
    type: "main",
  },
  {
    id: "treasurehunt",
    title: "Treasure Hunt",
    description:
      "Find the hidden treasure in the maze by finding the correct words to the solution.",
    image_path: "/Assets/TreasureHunt/treasure.png",
    href: "/treasurehunt",
    type: "mini",
  },
  {
    id: "unscramble",
    title: "Unscramble",
    description:
      "Unscramble the words to reveal the hidden message by finding the correct words to the solution.",
    image_path: "/Assets/Unscramble/unscramble.png",
    href: "/unscramble",
    type: "mini",
  },
];
