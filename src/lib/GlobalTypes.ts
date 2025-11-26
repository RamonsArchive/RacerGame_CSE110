export type GameType = {
  id: string;
  title: string;
  description: string;
  image_path: string; // path to image in public folder
  href: string; // link to game page
  type: "main" | "mini"; // main game or mini game
};

export type MultiplayerPlayer = {
  id: string;
  name: string;
  joinedAt: number;
  gradeLevel: string;
  gameMode: string;
};

export type CreatorType = {
  id: string;
  name: string;
  year: string;
  major: string;
  favorite_movie?: string;
  project_focus: string;
  src: string;
  linkedin?: string;
};
