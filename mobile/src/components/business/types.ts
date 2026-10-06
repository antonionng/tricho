/** Shapes from /api/mobile/v1/business. */

export type Seat = {
  id: string;
  email: string;
  name: string | null;
  role: string | null;
  bio: string | null;
  showOnPage: boolean;
  photoUrl: string | null;
  createdAt: string;
};

export type StatField = "views" | "websiteClicks" | "perkViews" | "perkClaims";
export type StatDay = Record<StatField, number> & { day: string };

export type Seats = { used: number; limit: number; list: Seat[] };

export type BusinessDashboard =
  | { business: boolean; page: null; seats: Seats; web: { setup: string } }
  | {
      business: boolean;
      page: {
        id: string;
        name: string;
        slug: string;
        tierLabel: string;
        premium: boolean;
        isFounding: boolean;
        published: boolean;
        hidden: boolean;
        hasPerk: boolean;
        logo: string | null;
      };
      setup: {
        total: number;
        stepsLeft: number;
        steps: { id: string; label: string; done: boolean }[];
        next: { id: string; button: string; sentence: string } | null;
      };
      premium: { includes: string[] } | null;
      results: {
        days: number;
        nothingYet: boolean;
        series: StatDay[];
        metrics: { field: StatField; label: string; total: number; explain: string }[];
      };
      seats: Seats;
      jobs: { open: number };
      web: { portal: string; setup: string; perk: string; page: string | null };
    };

export type JobPhase = "hidden" | "closed" | "ended" | "live";

export type JobRow = {
  id: string;
  slug: string;
  title: string;
  location: string;
  employment: string;
  employmentLabel: string;
  workplaceLabel: string;
  phase: JobPhase;
  expiresAt: string;
  createdAt: string;
};

export type Option = { value: string; label: string };

export type JobsList = {
  ready: boolean;
  active: boolean;
  hasPage: boolean;
  pageName: string | null;
  jobDays: number;
  maxOpen: number;
  employment: Option[];
  workplace: Option[];
  jobs: JobRow[];
};

export type JobFields = {
  title: string;
  employment: string;
  workplace: string;
  location: string;
  country: string;
  pay: string;
  summary: string;
  description: string;
  applyEmail: string;
  applyUrl: string;
};

export type JobDetail = { id: string; slug: string } & { [K in keyof JobFields]: string | null };

/** What every business action answers: the sentence the website would show. */
export type ActionResult = { ok: true; saved?: string | null; message: string | null };
