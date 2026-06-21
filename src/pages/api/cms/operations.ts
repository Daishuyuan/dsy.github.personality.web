import type { APIRoute } from "astro";
import handler from "../../../features/cms/server/apiHandlers/operations.ts";
import { createAstroApiRoute } from "../../../features/cms/server/astroApi.ts";

export const ALL: APIRoute = createAstroApiRoute(handler);
