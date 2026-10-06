/** What /api/mobile/v1/learn sends. */
export type LearnHub = {
  member: boolean;
  professional: boolean;
  cpdHours: number;
  mine: {
    id: string;
    slug: string;
    title: string;
    certificate: { id: string; hours: number } | null;
    done: number;
    total: number;
    percent: number;
    status: string;
  }[];
  courses: {
    slug: string;
    title: string;
    summary: string;
    hours: number;
    status: "open" | "coming-soon";
    enrolled: boolean;
    price: string;
    image: string;
  }[];
  library: { id: string; title: string; summary: string; kind: string; audience: string }[];
};

export type PlainBlock = { type: "h2" | "p"; text: string };

export type LearnPiece = {
  piece: { id: string; title: string; summary: string; kind: string; audience: string; blocks: PlainBlock[] };
  assistantPrompt: string | null;
};

export const learnKey = ["learn"] as const;
