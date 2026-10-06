/** Shapes the /api/mobile/v1 community, home and chapter endpoints answer with. Dates arrive as ISO strings. */

export type Author = {
  id: string;
  name: string | null;
  image: string | null;
  isFounding: boolean;
  profession: string | null;
};

export type FeedPost = {
  id: string;
  title: string | null;
  content: string;
  space: string;
  spaceLabel: string | null;
  pinned: boolean;
  createdAt: string;
  author: Author;
  chapterId: string | null;
  chapter: { slug: string; city: string } | null;
  comments: number;
  useful: number;
  reacted: boolean;
};

export type FeedPage = {
  room: { id: string; label: string; blurb: string; prompt: string } | null;
  locked: { title: string; body: string } | null;
  posting: { canPost: boolean; notice: string | null };
  posts: FeedPost[];
  nextCursor: string | null;
};

export type RoomInfo = {
  id: string;
  label: string;
  blurb: string;
  prompt: string;
  professionalOnly: boolean;
  canRead: boolean;
  canPost: boolean;
};

export type RoomsResponse = { rooms: RoomInfo[]; chapter: { slug: string; city: string } | null };

export type ThreadComment = {
  id: string;
  content: string;
  createdAt: string;
  parentId: string | null;
  author: Author;
  useful: number;
  reacted: boolean;
  mine: boolean;
};

export type ThreadResponse = {
  post: {
    id: string;
    title: string | null;
    content: string;
    pinned: boolean;
    createdAt: string;
    author: Author;
    chapter: { slug: string; city: string } | null;
    useful: number;
    reacted: boolean;
    mine: boolean;
    comments: number;
  };
  room: { id: string; label: string } | null;
  thread: (ThreadComment & { replies: ThreadComment[] })[];
  canReply: boolean;
  replyNotice: string | null;
};

export type MiniEvent = { id: string; slug: string; title: string; startsAt: string; city: string | null; online: boolean; going: boolean };
export type MiniMember = { id: string; name: string | null; image: string | null; profession: string | null };

export type HomeResponse =
  | { member: false; name: string | null }
  | {
      member: true;
      name: string | null;
      user: { isFounding: boolean; profession: string | null; chapter: { slug: string; city: string } | null };
      checklist: { done: boolean; label: string; href: string }[];
      feed: FeedPost[];
      events: MiniEvent[];
      gazette: { id: string; title: string; summary: string | null; publishedAt: string | null } | null;
      people: MiniMember[];
    };

export type ChapterResponse = {
  chapter: { slug: string; city: string; country: string };
  isMine: boolean;
  blurb: string | null;
  posts: FeedPost[];
  members: MiniMember[];
  memberCount: number;
  events: MiniEvent[];
};
