import { beforeEach, describe, expect, it } from "vitest";
import { uploadImage } from "../server/assetService";
import { resetCmsMemoryStore } from "./fixtures";

describe("asset service", () => {
  beforeEach(() => {
    resetCmsMemoryStore();
  });

  it("stores image metadata without exposing credentials", async () => {
    const asset = await uploadImage({
      fileName: "My Image.webp",
      contentType: "image/webp",
      sizeBytes: 12,
      dataBase64: Buffer.from("ok").toString("base64")
    });
    expect(asset.publicUrl).toContain("/assets/uploads/");
    expect(asset.originalName).toBe("my-image.webp");
  });
});
