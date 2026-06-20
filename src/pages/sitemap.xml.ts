import type { APIRoute } from "astro";
import { getPublicArticles } from "../features/content/source";
import type { BlogPost } from "../lib/posts";

export const GET: APIRoute = async () => {
  const site = "https://dsygithubpersonalityweb.vercel.app";
  let articles: BlogPost[] = [];
  try {
    articles = await getPublicArticles();
  } catch {
    articles = [];
  }
  const urls = [
    "/",
    "/archives/",
    "/tags/",
    ...articles.map((article) => article.legacyPath)
  ];
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((path) => `  <url><loc>${site}${path}</loc></url>`)
    .join("\n")}\n</urlset>`;
  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8"
    }
  });
};
