/**
 * The shape of a course's teaching content. Lessons live in
 * src/content/course-lessons/<slug>.ts, one file per course, so every change to
 * what we teach goes through review like any other change to the site.
 */

/** A multiple-choice question. `answer` is the index of the correct option. */
export type Question = {
  id: string;
  prompt: string;
  options: string[];
  answer: number;
  /** Why the right answer is right, shown after the learner answers. */
  explain: string;
};

export type CalloutTone = "tip" | "caution" | "redflag" | "scope";

export type LessonBlock =
  | { type: "p"; text: string }
  | { type: "h"; text: string }
  | { type: "list"; items: string[]; ordered?: boolean }
  | { type: "callout"; tone: CalloutTone; title: string; text: string }
  /** A short worked scenario. The learner thinks first, then reveals the discussion. */
  | { type: "case"; title: string; scenario: string; question: string; discussion: string }
  /** Words to use with a client: each line is something the practitioner could say. */
  | { type: "script"; title: string; lines: string[] }
  | { type: "steps"; title: string; steps: { title: string; detail: string }[] }
  | { type: "table"; caption: string; head: string[]; rows: string[][] }
  | { type: "terms"; items: { term: string; meaning: string }[] }
  /** A template the learner can copy, such as a referral letter or a checklist. */
  | { type: "template"; title: string; body: string };

export type Lesson = {
  slug: string;
  title: string;
  /** One line for the syllabus. */
  detail: string;
  minutes: number;
  objectives: string[];
  blocks: LessonBlock[];
  /** Two to four questions at the end of the lesson, with instant feedback. */
  check: Question[];
  /** A question for the learner's own CPD reflection, saved with their notes. */
  reflection: string;
  /** The three things to remember from this lesson. */
  takeaways: string[];
};

export type CourseContent = {
  lessons: Lesson[];
  /** The final assessment, graded on the server. */
  assessment: Question[];
};
