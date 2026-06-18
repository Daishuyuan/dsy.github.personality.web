export interface PublicComment {
  id: string;
  articleId: string;
  author: string;
  body: string;
  status: "approved";
  createdAt: string;
}

export interface EngagementSnapshot {
  articleId: string;
  likes: number;
  liked: boolean;
  comments: PublicComment[];
  mode: "atlas" | "memory";
}

export interface CommentDraft {
  articleId: string;
  visitorId: string;
  author: string;
  body: string;
}
