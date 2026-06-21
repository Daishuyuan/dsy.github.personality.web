import { createClient } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import publishHandler from "../server/apiHandlers/publish.ts";
import type { ApiResponseLike } from "../server/apiResponse.ts";
import { publishArticle } from "../server/articleService.ts";

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn()
}));

vi.mock("../server/articleService.ts", () => ({
  publishArticle: vi.fn()
}));

const mockedCreateClient = vi.mocked(createClient);
const mockedPublishArticle = vi.mocked(publishArticle);

describe("CMS API authorization boundary", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("PUBLIC_SUPABASE_ANON_KEY", "anon-key");
    vi.stubEnv("CMS_OWNER_EMAILS", "dsyshoushou@gmail.com");
  });

  it("rejects direct publish API calls from a non-owner Google account", async () => {
    mockedCreateClient.mockReturnValue(supabaseUser("other.user@gmail.com"));
    const res = createResponse();

    await publishHandler(
      {
        method: "POST",
        headers: { authorization: "Bearer valid-non-owner-supabase-token" },
        query: { articleId: "post:test" },
        body: { expectedVersion: 1 }
      },
      res
    );

    expect(res.statusCode).toBe(403);
    expect(res.body).toMatchObject({
      success: false,
      error: {
        code: "FORBIDDEN",
        message: "当前 Google 账号没有文章管理权限。"
      }
    });
    expect(mockedPublishArticle).not.toHaveBeenCalled();
  });
});

function createResponse() {
  const res = {
    headers: {} as Record<string, string>,
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(body: unknown) {
      this.body = body;
    },
    setHeader(name: string, value: string) {
      this.headers[name] = value;
    }
  };
  return res satisfies ApiResponseLike & { statusCode: number; body: unknown; headers: Record<string, string> };
}

function supabaseUser(email: string) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { email } }, error: null })
    }
  } as never;
}
