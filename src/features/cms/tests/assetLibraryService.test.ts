import { beforeEach, describe, expect, it } from "vitest";
import { listImageLibrary, uploadImage } from "../server/assetService";
import { resetCmsMemoryStore } from "./fixtures";

describe("asset library service", () => {
  beforeEach(() => resetCmsMemoryStore());

  it("lists uploaded images with filters", async () => {
    await uploadImage({ fileName: "Hero.webp", contentType: "image/webp", sizeBytes: 4, dataBase64: "AA==" });

    const result = await listImageLibrary({ state: "unused", page: 1, pageSize: 20 });

    expect(result.total).toBe(1);
    expect(result.items[0]).toMatchObject({ originalName: "hero.webp", cleanupCandidate: true });
  });
});
