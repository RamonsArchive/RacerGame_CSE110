import { GameType } from "@/lib/GlobalTypes";

export const GAMES: GameType[] = [
  {
    id: "typeracer",
    title: "Type Racer",
    description:
      "Race against the clock to type as many gramatically correct words as possible.",
    image_path: "/Assets/TypeRacer/tr_gamePic.jpg",
    href: "/typeracer",
    type: "main",
  },
  {
    id: "treasurehunt",
    title: "Treasure Hunt",
    description:
      "Find the hidden treasure in the maze by finding the correct words to the solution.",
    image_path: "/Assets/TreasureHunt/th_gamePic.jpg",
    href: "/treasurehunt",
    type: "mini",
  },
  {
    id: "unscramble",
    title: "Unscramble",
    description:
      "Unscramble the words to reveal the hidden message by finding the correct words to the solution.",
    image_path: "/Assets/Unscramble/us_gamePic.jpg",
    href: "/unscramble",
    type: "mini",
  },
];
