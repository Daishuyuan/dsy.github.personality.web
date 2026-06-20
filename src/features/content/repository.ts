import type { Article, ArticleDraftInput, ArticleVersion, ImageAsset, MigrationReport, PaginatedResult } from "../cms/types.ts";
import type { PublicArticle } from "./types.ts";

export interface ArticleListQuery {
  status?: Article["status"];
  page: number;
  pageSize: number;
  q?: string;
  tag?: string;
}

export interface ContentRepository {
  listOwnerArticles(query: ArticleListQuery): Promise<PaginatedResult<Article>>;
  listPublishedArticles(): Promise<PublicArticle[]>;
  findArticleById(articleId: string): Promise<Article | null>;
  findPublishedByPath(path: string): Promise<PublicArticle | null>;
  saveArticle(input: ArticleDraftInput, actor: string): Promise<Article>;
  publishArticle(articleId: string, expectedVersion: number, actor: string): Promise<Article>;
  archiveArticle(articleId: string, expectedVersion: number, actor: string): Promise<Article>;
  listVersions(articleId: string): Promise<ArticleVersion[]>;
  rollbackArticle(articleId: string, versionId: string, expectedVersion: number, actor: string): Promise<Article>;
  saveAsset(asset: ImageAsset): Promise<ImageAsset>;
  listAssets(): Promise<ImageAsset[]>;
  saveMigrationReport(report: MigrationReport): Promise<MigrationReport>;
}
