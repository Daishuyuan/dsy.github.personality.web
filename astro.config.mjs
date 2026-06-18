import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://dsy-github-personality-web.vercel.app",
  output: "static",
  trailingSlash: "always",
  integrations: [sitemap()],
  markdown: {
    shikiConfig: {
      theme: "github-dark"
    }
  }
});
