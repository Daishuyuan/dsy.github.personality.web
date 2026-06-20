import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware((context, next) => {
  const { pathname, search } = context.url;
  if (pathname.startsWith("/api/cms/") && !pathname.endsWith("/")) {
    return context.rewrite(`${pathname}/${search}`);
  }
  return next();
});
