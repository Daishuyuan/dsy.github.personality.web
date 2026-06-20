import sitemap from "@astrojs/sitemap";
import vercel from "@astrojs/vercel";
import vue from "@astrojs/vue";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://dsygithubpersonalityweb.vercel.app",
  output: "server",
  adapter: vercel(),
  trailingSlash: "ignore",
  devToolbar: {
    enabled: false
  },
  integrations: [vue(), sitemap()],
  markdown: {
    shikiConfig: {
      theme: "github-dark"
    }
  }
});
