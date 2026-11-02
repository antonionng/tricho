/** Everything the blog editor sends when it saves. */
export type EditorData = {
  title: string;
  slug: string;
  description: string;
  category: string;
  audience: string;
  author: string;
  image: string;
  /** Comma separated. */
  tags: string;
  standfirst: string;
  answer: string;
  /** One per line. */
  takeaways: string;
  body: string;
  faqs: { q: string; a: string }[];
  sources: { label: string; url: string }[];
  relatedGuides: string[];
  relatedGlossary: string[];
  discipline: string;
  featured: boolean;
  reviewerName: string;
  reviewerCredentials: string;
  reviewedOn: string;
  targetQuery: string;
};
