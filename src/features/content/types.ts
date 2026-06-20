export interface PublicArticle {
  articleId: string;
  legacyPath: string;
  slugSegments: string[];
  title: string;
  publishedDate: string;
  tags: string[];
  toc: boolean;
  renderedHtml: string;
  excerpt?: string;
  updatedAt: string;
}

export type ContentSourceMode = "database";
