import type { ImageKey } from "@/content/gazette/types";

export type DisciplineId = "cosmetic" | "clinical" | "medical";

export type Discipline = {
  id: DisciplineId;
  slug: string;
  name: string;
  /** Plural for SEO pages: "Trichologists in Dublin". */
  plural: string;
  who: string;
  role: string;
  helpsWith: string[];
  imageKey: ImageKey;
};

export const DISCIPLINES: Discipline[] = [
  {
    id: "cosmetic",
    slug: "cosmetic",
    name: "Cosmetic",
    plural: "Head spa and cosmetic hair specialists",
    who: "Head spa therapists, stylists, barbers, aestheticians, and beauty and nail therapists.",
    role:
      "Often the first to notice a change in a client's hair or scalp. Trichollective helps cosmetic practitioners spot red flags early and refer on to the right clinician.",
    helpsWith: ["Head spa and scalp treatments", "Dry, oily or flaky scalp care", "Styling that works with thinning hair", "Referring on when something needs a closer look"],
    imageKey: "ed16",
  },
  {
    id: "clinical",
    slug: "clinical",
    name: "Clinical",
    plural: "Trichologists and clinical hair specialists",
    who: "Trichologists and clinical hair and scalp specialists.",
    role:
      "Take a full case history, examine the hair and scalp with trichoscopy and build a care plan. They refer to GPs and dermatologists when a medical opinion is needed.",
    helpsWith: ["Hair shedding and thinning", "Scalp conditions", "Trichoscopy, consultations and care plans", "Working alongside your GP"],
    imageKey: "ed31",
  },
  {
    id: "medical",
    slug: "medical",
    name: "Medical",
    plural: "Doctors and nurses in hair and scalp care",
    who: "GPs, dermatologists, nurses and aesthetic doctors.",
    role:
      "Diagnose and treat medical causes of hair loss and scalp disease, order blood tests and prescribe. They are the right first stop when there are red flags.",
    helpsWith: ["Diagnosis", "Blood tests and prescriptions", "Scarring and sudden hair loss", "Scalp disease"],
    imageKey: "ed14",
  },
];

export function disciplineBySlug(slug: string) {
  return DISCIPLINES.find((d) => d.slug === slug);
}
