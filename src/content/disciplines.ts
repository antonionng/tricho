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
  imageKey: "headSpa" | "clinic" | "salon";
};

export const DISCIPLINES: Discipline[] = [
  {
    id: "cosmetic",
    slug: "cosmetic",
    name: "Cosmetic",
    plural: "Head spa and cosmetic hair specialists",
    who: "Head spa therapists, stylists and scalp care specialists.",
    role:
      "Often the first to notice a change in someone's hair or scalp. Cosmetic practitioners care for the scalp week to week and know when to refer on.",
    helpsWith: ["Head spa and scalp treatments", "Dry, oily or flaky scalp care", "Gentle styling for thinning hair", "Knowing when to refer"],
    imageKey: "headSpa",
  },
  {
    id: "clinical",
    slug: "clinical",
    name: "Clinical",
    plural: "Trichologists and clinical hair specialists",
    who: "Trichologists and clinical hair and scalp specialists.",
    role:
      "Take a full history, examine the hair and scalp closely, and build a care plan. They work alongside GPs and dermatologists when a medical opinion is needed.",
    helpsWith: ["Hair shedding and thinning", "Scalp conditions", "Consultations and care plans", "Working with your GP"],
    imageKey: "clinic",
  },
  {
    id: "medical",
    slug: "medical",
    name: "Medical",
    plural: "Doctors and nurses in hair and scalp care",
    who: "GPs, dermatologists, nurses and aesthetic doctors.",
    role:
      "Diagnose and treat medical causes of hair loss and scalp disease, order blood tests and prescribe. The right first stop when there are red flags.",
    helpsWith: ["Diagnosis", "Blood tests and prescriptions", "Scarring and sudden hair loss", "Scalp disease"],
    imageKey: "salon",
  },
];

export function disciplineBySlug(slug: string) {
  return DISCIPLINES.find((d) => d.slug === slug);
}
