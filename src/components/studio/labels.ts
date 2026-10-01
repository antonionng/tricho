export const KIND_LABEL: Record<string, string> = {
  gazette_article: "Trichozette article",
  community_post: "Community post",
  community_nudge: "Quiet post",
  email: "Email",
  newsletter: "Newsletter",
  partner_enquiry: "Partner enquiry",
  contact: "Contact message",
  announcement: "New release email",
};

export const kindLabel = (kind: string) => KIND_LABEL[kind] ?? kind.replace(/_/g, " ");

export const STATUS_LABEL: Record<string, string> = {
  draft: "Waiting",
  approved: "Handled",
  published: "Published",
  rejected: "Rejected",
};

/** What the approve button says for each kind. */
export function approveLabel(kind: string) {
  switch (kind) {
    case "gazette_article":
      return "Approve & publish";
    case "community_post":
      return "Approve & post";
    case "email":
      return "Approve & send";
    case "newsletter":
    case "announcement":
      return "Approve & send to everyone…";
    default:
      return "Mark as handled";
  }
}

export const EVENT_KIND_LABEL: Record<string, string> = {
  gathering: "Gathering",
  masterclass: "Masterclass",
  case_round: "Case round",
  chapter_meetup: "Chapter meet-up",
  welcome: "Welcome session",
};
