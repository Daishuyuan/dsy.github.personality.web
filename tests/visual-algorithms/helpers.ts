import { expect, type Page } from "@playwright/test";

export const visualAlgorithmSlugs = [
  "cute-box",
  "crane",
  "perfect-world",
  "basketball",
  "cell-war",
  "lake-counting",
  "ip-address-split",
  "escape-pathfinding",
  "circle-center"
];

export const autoAlgorithmSlugs = [
  "cute-box",
  "crane",
  "perfect-world",
  "basketball",
  "cell-war",
  "ip-address-split",
  "circle-center"
];

export const playbackAlgorithmSlugs = [
  "cute-box",
  "perfect-world",
  "basketball",
  "cell-war",
  "lake-counting",
  "escape-pathfinding",
  "circle-center"
];

export function isAutoAlgorithm(slug: string) {
  return autoAlgorithmSlugs.includes(slug);
}

export function hasPlayback(slug: string) {
  return playbackAlgorithmSlugs.includes(slug);
}

export async function expectDetailPageReady(page: Page, slug: string) {
  await page.goto(`/visual-algorithms/${slug}/`);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("button", { name: isAutoAlgorithm(slug) ? "重播" : "运行" })).toBeVisible();
  await expect(page.getByRole("button", { name: "重置" })).toBeVisible();
  await expect(page.locator(".va-status")).toContainText(/已完成|待运行|正在/);
}

export async function expectVisualOutput(page: Page) {
  const textResult = page.locator(".va-text-result");
  await expect(textResult).toBeVisible();
  await expect(textResult).not.toContainText("等待运行");

  const canvas = page.locator("canvas.va-canvas");
  if ((await canvas.count()) > 0) {
    await expect(canvas.first()).toBeVisible();
    const nonBlank = await canvas.first().evaluate((node) => {
      const canvasElement = node as HTMLCanvasElement;
      if (canvasElement.width === 0 || canvasElement.height === 0) {
        return false;
      }
      const context = canvasElement.getContext("2d");
      if (!context) {
        return true;
      }
      const sample = context.getImageData(0, 0, canvasElement.width, canvasElement.height);
      let sawPaint = false;
      let firstColor = "";
      let sawDifferentColor = false;

      for (let index = 0; index < sample.data.length; index += 4) {
        const red = sample.data[index] ?? 0;
        const green = sample.data[index + 1] ?? 0;
        const blue = sample.data[index + 2] ?? 0;
        const alpha = sample.data[index + 3] ?? 0;
        const painted = alpha > 0 && !(red === 255 && green === 255 && blue === 255);

        if (painted) {
          sawPaint = true;
        }

        const color = `${red},${green},${blue},${alpha}`;
        if (!firstColor) {
          firstColor = color;
        } else if (color !== firstColor) {
          sawDifferentColor = true;
        }

        if (sawPaint && sawDifferentColor) {
          return true;
        }
      }

      return sawPaint || sawDifferentColor;
    });
    expect(nonBlank).toBe(true);
  }
}

export async function readCanvasFrame(page: Page) {
  const canvas = page.locator("canvas.va-canvas");
  if ((await canvas.count()) === 0) {
    return null;
  }
  await expect(canvas.first()).toBeVisible();
  return canvas.first().evaluate((node) => (node as HTMLCanvasElement).toDataURL());
}

export async function expectCanvasChangedFrom(page: Page, frame: string | null) {
  if (frame === null) {
    return;
  }

  const canvas = page.locator("canvas.va-canvas");
  await expect
    .poll(() => canvas.first().evaluate((node) => (node as HTMLCanvasElement).toDataURL()), {
      timeout: 3000
    })
    .not.toBe(frame);
}

export async function expectCanvasAnimation(page: Page) {
  const canvas = page.locator("canvas.va-canvas");
  if ((await canvas.count()) === 0) {
    return;
  }

  await expect(canvas.first()).toBeVisible();
  const frames: string[] = [];
  for (let index = 0; index < 8; index += 1) {
    await page.waitForTimeout(180);
    frames.push(await canvas.first().evaluate((node) => (node as HTMLCanvasElement).toDataURL()));
  }
  expect(new Set(frames).size).toBeGreaterThan(1);
}
