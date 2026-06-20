import { describe, expect, it } from "vitest";
import { toApiError } from "../server/apiResponse.ts";
import { CmsDatabaseUnavailableError } from "../server/mongo.ts";

describe("cms API error mapping", () => {
  it("maps database availability errors to content source failures", () => {
    const apiError = toApiError(new CmsDatabaseUnavailableError("数据库连接超时，文章无法加载。", "timeout"));

    expect(apiError.code).toBe("CONTENT_SOURCE_UNAVAILABLE");
    expect(apiError.statusCode).toBe(503);
    expect(apiError.message).toBe("数据库连接超时，文章无法加载。");
  });
});
