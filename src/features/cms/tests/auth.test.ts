import { createClient } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { requireOwner } from "../server/auth.ts";
import type { ApiRequestLike } from "../server/apiResponse.ts";

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn()
}));

const mockedCreateClient = vi.mocked(createClient);

describe("cms owner authentication", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("rejects requests without a bearer token", async () => {
    await expect(requireOwner(req())).rejects.toMatchObject({
      code: "AUTH_REQUIRED",
      statusCode: 401,
      message: "请先使用 Google 账号登录。"
    });
  });

  it("keeps ADMIN_TOKEN fallback when Supabase public auth is not configured", async () => {
    vi.stubEnv("ADMIN_TOKEN", "local-secret");
    vi.stubEnv("CMS_OWNER_EMAILS", "");
    vi.stubEnv("PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("PUBLIC_SUPABASE_ANON_KEY", "");

    await expect(requireOwner(req("local-secret"))).resolves.toBe("owner");
    expect(mockedCreateClient).not.toHaveBeenCalled();
  });

  it("rejects ADMIN_TOKEN fallback in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ADMIN_TOKEN", "local-secret");
    vi.stubEnv("CMS_OWNER_EMAILS", "");
    vi.stubEnv("PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("PUBLIC_SUPABASE_ANON_KEY", "");

    await expect(requireOwner(req("local-secret"))).rejects.toMatchObject({
      code: "AUTH_REQUIRED",
      statusCode: 401,
      message: "生产环境必须使用 Google 登录。"
    });
    expect(mockedCreateClient).not.toHaveBeenCalled();
  });

  it("accepts a Supabase Google session whose email is allowlisted", async () => {
    vi.stubEnv("PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("PUBLIC_SUPABASE_ANON_KEY", "anon-key");
    vi.stubEnv("CMS_OWNER_EMAILS", "OWNER@example.com, other@example.com");
    mockedCreateClient.mockReturnValue(supabaseUser("owner@example.com"));

    await expect(requireOwner(req("jwt-token"))).resolves.toBe("owner@example.com");
  });

  it("rejects Supabase auth when the owner email allowlist is missing", async () => {
    vi.stubEnv("ADMIN_TOKEN", "local-secret");
    vi.stubEnv("PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("PUBLIC_SUPABASE_ANON_KEY", "anon-key");
    vi.stubEnv("CMS_OWNER_EMAILS", "");

    await expect(requireOwner(req("local-secret"))).rejects.toMatchObject({
      code: "FORBIDDEN",
      statusCode: 403,
      message: "未配置管理员邮箱白名单。"
    });
    expect(mockedCreateClient).not.toHaveBeenCalled();
  });

  it("rejects a Supabase Google session whose email is not allowlisted", async () => {
    vi.stubEnv("PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("PUBLIC_SUPABASE_ANON_KEY", "anon-key");
    vi.stubEnv("CMS_OWNER_EMAILS", "owner@example.com");
    mockedCreateClient.mockReturnValue(supabaseUser("reader@example.com"));

    await expect(requireOwner(req("jwt-token"))).rejects.toMatchObject({
      code: "FORBIDDEN",
      statusCode: 403,
      message: "当前 Google 账号没有文章管理权限。"
    });
  });

  it("does not fall back to ADMIN_TOKEN when Supabase public auth is configured", async () => {
    vi.stubEnv("ADMIN_TOKEN", "local-secret");
    vi.stubEnv("PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("PUBLIC_SUPABASE_ANON_KEY", "anon-key");
    vi.stubEnv("CMS_OWNER_EMAILS", "owner@example.com");
    mockedCreateClient.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: new Error("invalid token") })
      }
    } as never);

    await expect(requireOwner(req("local-secret"))).rejects.toMatchObject({
      code: "AUTH_REQUIRED",
      statusCode: 401,
      message: "Google 登录已失效，请重新登录。"
    });
  });
});

function req(token?: string): ApiRequestLike {
  return {
    headers: token ? { authorization: `Bearer ${token}` } : {}
  };
}

function supabaseUser(email: string) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { email } }, error: null })
    }
  } as never;
}
