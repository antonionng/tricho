/** The shapes /api/mobile/v1/courses answers with. Dates arrive as ISO strings. */

export type CourseCard = {
  slug: string;
  title: string;
  summary: string;
  audience: string;
  discipline: string;
  format: string;
  hours: number;
  status: "open" | "coming-soon";
  image: string;
  priceGBP: number;
  memberPriceGBP: number;
  yourPrice: { amountPence: number; priceType: "member" | "guest" | "free" };
  reviewer: { name: string; credentials: string } | null;
};

export type CourseListItem = CourseCard & {
  enrolment: {
    done: number;
    total: number;
    percent: number;
    next: string | null;
    updatedAt: string;
    certificate: { id: string; hours: number; issuedAt: string } | null;
  } | null;
};

export type CourseList = { courses: CourseListItem[]; mine: string[]; cpdHours: number; member: boolean };

export type CourseDetail = {
  course: CourseCard & { outcomes: string[]; syllabus: { title: string; detail: string }[] };
  access: "active" | "pending" | "none";
  member: boolean;
  preview?: boolean;
  activatedAt?: string | null;
  progress?: { done: number; total: number; percent: number; next: string | null };
  reflections?: number;
  lessons?: {
    slug: string;
    title: string;
    detail: string;
    minutes: number;
    done: boolean;
    checkScore: number | null;
    checkTotal: number | null;
    reflected: boolean;
  }[];
  assessment?: { questions: number; passMark: number; best: number | null; open: boolean; passed: boolean };
  certificate?: { id: string; hours: number; issuedAt: string } | null;
};

export type Question = { id: string; prompt: string; options: string[] };

export type CalloutTone = "tip" | "caution" | "redflag" | "scope";

export type LessonBlock =
  | { type: "p"; text: string }
  | { type: "h"; text: string }
  | { type: "list"; items: string[]; ordered?: boolean }
  | { type: "callout"; tone: CalloutTone; title: string; text: string }
  | { type: "case"; title: string; scenario: string; question: string; discussion: string }
  | { type: "script"; title: string; lines: string[] }
  | { type: "steps"; title: string; steps: { title: string; detail: string }[] }
  | { type: "table"; caption: string; head: string[]; rows: string[][] }
  | { type: "terms"; items: { term: string; meaning: string }[] }
  | { type: "template"; title: string; body: string };

export type LessonData = {
  course: { slug: string; title: string };
  index: number;
  count: number;
  percent: number;
  lesson: {
    slug: string;
    title: string;
    detail: string;
    minutes: number;
    objectives: string[];
    blocks: LessonBlock[];
    takeaways: string[];
    reflection: string;
    check: Question[];
  };
  done: boolean;
  notes: string;
  reflection: string;
  canSave: boolean;
  prev: { slug: string; title: string } | null;
  next: { slug: string; title: string } | null;
  outline: { slug: string; title: string; done: boolean }[];
};

export type CheckResult = {
  ok: true;
  score: number;
  total: number;
  saved: boolean;
  note?: string;
  results: { id: string; chosen: number | null; correct: boolean; answer: number; explain: string }[];
};

export type AssessmentData = {
  course: { slug: string; title: string };
  total: number;
  needed: number;
  passMark: number;
  locked: boolean;
  remaining: { slug: string; title: string }[];
  attempts: { score: number; total: number; passed: boolean; createdAt: string }[];
  holderName: string;
  questions: Question[];
  certificate: { id: string; issuedAt: string; score: number; total: number } | null;
  review: { id: string; prompt: string; answer: string; explain: string }[] | null;
};

export type AssessmentResult = {
  ok: true;
  passed: boolean;
  score: number;
  total: number;
  needed: number;
  wrong: string[];
  explanations: Record<string, { answer: number; explain: string }> | null;
  certificate: string | null;
};

export type CertificateData = {
  certificate: {
    id: string;
    holderName: string;
    courseTitle: string;
    hours: number;
    issuedAt: string;
    score: number;
    total: number;
    showOnProfile: boolean;
    withdrawnAt: string | null;
    withdrawnNote: string | null;
  };
  course: { slug: string; title: string };
  reviewer: string | null;
  url: string;
  linkedIn: string;
  contactEmail: string;
  record: {
    slug: string;
    title: string;
    reflectionPrompt: string;
    completedAt: string | null;
    checkScore: number | null;
    checkTotal: number | null;
    reflection: string;
    notes: string;
  }[];
};

/** "6 October 2026", as the website writes dates. */
export function longDate(iso: string | null | undefined) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}
