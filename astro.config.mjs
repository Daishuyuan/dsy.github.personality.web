import sitemap from "@astrojs/sitemap";
import vue from "@astrojs/vue";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://dsygithubpersonalityweb.vercel.app",
  output: "static",
  trailingSlash: "always",
  integrations: [vue(), sitemap()],
  markdown: {
    shikiConfig: {
      theme: "github-dark"
    }
  }
});
