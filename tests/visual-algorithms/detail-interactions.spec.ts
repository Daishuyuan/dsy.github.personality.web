import { expect, type Page, test } from "@playwright/test";
import {
  expectCanvasAnimation,
  expectCanvasChangedFrom,
  expectDetailPageReady,
  expectVisualOutput,
  hasPlayback,
  isAutoAlgorithm,
  readCanvasFrame,
  visualAlgorithmSlugs
} from "./helpers";

const alternateInputs: Record<string, (page: Page) => Promise<void>> = {
  "cute-box": async (page) => {
    await page.locator(".va-workbench-controls input").nth(2).fill("10");
  },
  crane: async (page) => {
    await page.locator(".va-slider-list input").first().fill("120");
  },
  "perfect-world": async (page) => {
    await page.locator(".va-workbench-controls input").first().fill("8");
  },
  basketball: async (page) => {
    await page.locator(".va-workbench-controls input").first().fill("30");
  },
  "cell-war": async (page) => {
    await page.locator(".va-workbench-controls input").first().fill("12");
  },
  "lake-counting": async (page) => {
    await page.locator(".va-lake-cell").nth(7).click();
  },
  "ip-address-split": async (page) => {
    await page.locator(".va-ip-control input").nth(0).fill("0");
    await page.locator(".va-ip-control input").nth(1).fill("0");
    await page.locator(".va-ip-control input").nth(2).fill("0");
    await page.locator(".va-ip-control input").nth(3).fill("0");
  },
  "escape-pathfinding": async (page) => {
    await page.getByRole("button", { name: "终点", exact: true }).click();
    await page.locator(".va-path-cell").nth(4).click();
  },
  "circle-center": async (page) => {
    await page.locator(".va-point-list input").nth(0).fill("0");
    await page.locator(".va-point-list input").nth(1).fill("0");
    await page.locator(".va-point-list input").nth(2).fill("100");
    await page.locator(".va-point-list input").nth(3).fill("0");
    await page.locator(".va-point-list input").nth(4).fill("0");
    await page.locator(".va-point-list input").nth(5).fill("100");
  }
};

async function expectPlaybackIfAvailable(page: Page, slug: string) {
  if (!hasPlayback(slug)) {
    return;
  }

  await expect(page.locator(".va-playback")).toBeVisible();
  await expect(page.locator(".va-frame-summary")).toBeVisible();
  await expect(page.getByRole("button", { name: "上一帧" })).toBeVisible();
  await expect(page.getByRole("button", { name: "下一帧" })).toBeVisible();
  await expect(page.getByRole("button", { name: "从头播放" })).toBeVisible();
}

for (const slug of visualAlgorithmSlugs) {
  test(`${slug} runs, updates after input changes, resets, and reloads cleanly`, async ({ page }) => {
    const auto = isAutoAlgorithm(slug);
    await expectDetailPageReady(page, slug);

    if (auto) {
      await expect(page.locator(".va-status")).toContainText("已完成");
      await expectVisualOutput(page);
      await expectPlaybackIfAvailable(page, slug);
      const beforeReplayFrame = await readCanvasFrame(page);
      await page.getByRole("button", { name: "重播" }).click();
      await expectCanvasChangedFrom(page, beforeReplayFrame);
      await expect(page.locator(".va-status")).toContainText("已完成");
      await expectCanvasAnimation(page);
    } else {
      await expect(page.locator(".va-status")).toContainText("待运行");
      await expect(page.locator(".va-text-result")).toContainText("等待运行");
      const beforeRunFrame = await readCanvasFrame(page);
      await page.getByRole("button", { name: "运行" }).click();
      await expectCanvasChangedFrom(page, beforeRunFrame);
      await expect(page.locator(".va-status")).toContainText("已完成");
      await expectCanvasAnimation(page);
      await expectVisualOutput(page);
      await expectPlaybackIfAvailable(page, slug);
    }

    const firstResult = await page.locator(".va-text-result").innerText();
    const beforeAlternateFrame = await readCanvasFrame(page);

    await alternateInputs[slug](page);
    if (!auto) {
      const beforeRunFrame = await readCanvasFrame(page);
      await page.getByRole("button", { name: "运行" }).click();
      await expectCanvasChangedFrom(page, beforeRunFrame);
      await expect(page.locator(".va-status")).toContainText("已完成");
      await expect.poll(() => page.locator(".va-text-result").innerText()).not.toBe(firstResult);
    } else {
      await expect.poll(() => page.locator(".va-text-result").innerText()).not.toBe(firstResult);
      await expectCanvasChangedFrom(page, beforeAlternateFrame);
      await expect(page.locator(".va-status")).toContainText("已完成");
    }
    await expectVisualOutput(page);
    await expectPlaybackIfAvailable(page, slug);

    await page.getByRole("button", { name: "重置" }).click();
    if (auto) {
      await expect(page.locator(".va-status")).toContainText("已完成");
      await expectVisualOutput(page);
    } else {
      await expect(page.locator(".va-status")).toContainText("待运行");
      await expect(page.locator(".va-text-result")).toContainText("等待运行");

      await page.getByRole("button", { name: "运行" }).click();
      await expect(page.locator(".va-status")).toContainText("已完成");
    }

    await page.reload();
    if (auto) {
      await expect(page.locator(".va-status")).toContainText("已完成");
      await expectVisualOutput(page);
    } else {
      await expect(page.locator(".va-status")).toContainText("待运行");
      await expect(page.locator(".va-text-result")).toContainText("等待运行");
    }
  });
}

test("framed algorithm playback controls pause, step, and restart frames", async ({ page }) => {
  await expectDetailPageReady(page, "escape-pathfinding");
  await page.getByRole("button", { name: "运行" }).click();
  await expect(page.locator(".va-status")).toContainText("已完成");
  await expectPlaybackIfAvailable(page, "escape-pathfinding");

  await page.getByRole("button", { name: "暂停" }).click();
  const beforeStep = await readCanvasFrame(page);
  await page.getByRole("button", { name: "下一帧" }).click();
  await expectCanvasChangedFrom(page, beforeStep);
  await expect(page.locator(".va-frame-summary")).toContainText(/BFS|路径|搜索/);
  const afterNext = await readCanvasFrame(page);
  await page.getByRole("button", { name: "上一帧" }).click();
  await expectCanvasChangedFrom(page, afterNext);

  await page.getByRole("button", { name: "从头播放" }).click();
  await page.getByRole("button", { name: "暂停" }).click();
  await expect(page.locator(".va-frame-index")).toContainText("第 1 /");
  const beforeScrub = await readCanvasFrame(page);
  const progress = page.locator(".va-playback-progress .el-slider").first();
  const progressBox = await progress.boundingBox();
  expect(progressBox).not.toBeNull();
  if (progressBox) {
    await page.mouse.click(progressBox.x + progressBox.width * 0.72, progressBox.y + progressBox.height / 2);
  }
  await expectCanvasChangedFrom(page, beforeScrub);

  await page.locator(".va-playback-speed .el-select").click();
  await page.getByRole("option", { name: "2x" }).click();

  const nextButton = page.getByRole("button", { name: "下一帧" });
  for (let index = 0; index < 40; index += 1) {
    if (!(await nextButton.isEnabled())) {
      break;
    }
    await nextButton.click();
  }
  const playButton = page.getByRole("button", { name: "播放", exact: true });
  await expect(playButton).toBeVisible();
  const endFrame = await readCanvasFrame(page);
  await playButton.click();
  await expectCanvasChangedFrom(page, endFrame);
});

test("crane slider controls and frame metrics stay readable", async ({ page }) => {
  await expectDetailPageReady(page, "crane");
  await expect(page.locator(".va-status")).toContainText("已完成");
  await expect(page.locator(".va-status")).toContainText("末端坐标：(27.8, 251.8)");
  await expect(page.locator(".va-playback")).toHaveCount(0);

  const sliderRows = await page.locator(".va-slider-row").evaluateAll((rows) =>
    rows.map((row) => {
      const runway = row.querySelector(".el-slider__runway");
      const input = row.querySelector(".el-slider__input");
      return {
        runwayWidth: runway?.getBoundingClientRect().width ?? 0,
        inputWidth: input?.getBoundingClientRect().width ?? 0
      };
    })
  );

  expect(sliderRows).toHaveLength(8);
  expect(sliderRows.every((row) => row.runwayWidth >= 100 && row.inputWidth >= 70)).toBe(true);

  const overflowCount = await page.locator(".va-workbench").evaluate((workbench) => {
    const bounds = workbench.getBoundingClientRect();
    return Array.from(workbench.querySelectorAll(".va-frame-summary, .va-frame-metric, .va-frame-metric *")).filter(
      (node) => node.getBoundingClientRect().right > bounds.right + 1
    ).length;
  });

  expect(overflowCount).toBe(0);

  const canvas = page.locator("canvas.va-canvas").first();
  const centerBefore = await canvas.evaluate((node) => {
    const element = node as HTMLCanvasElement;
    return { x: Math.round(element.width / 2), y: Math.round(element.height / 2) };
  });
  await page.locator(".va-slider-list input").first().fill("120");
  await expect(page.locator(".va-status")).toContainText("已完成");
  const centerAfter = await canvas.evaluate((node) => {
    const element = node as HTMLCanvasElement;
    return { x: Math.round(element.width / 2), y: Math.round(element.height / 2) };
  });
  expect(centerAfter).toEqual(centerBefore);

  const frameBeforeDrag = await readCanvasFrame(page);
  const firstRunway = page.locator(".va-slider-row .el-slider__runway").first();
  const runwayBox = await firstRunway.boundingBox();
  expect(runwayBox).not.toBeNull();
  if (runwayBox && frameBeforeDrag) {
    await page.mouse.move(runwayBox.x + runwayBox.width * 0.35, runwayBox.y + runwayBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(runwayBox.x + runwayBox.width * 0.7, runwayBox.y + runwayBox.height / 2, { steps: 6 });
    await expectCanvasChangedFrom(page, frameBeforeDrag);
    await page.mouse.up();
  }
});

test("ip split accepts raw digit strings and dotted candidate editing", async ({ page }) => {
  await expectDetailPageReady(page, "ip-address-split");
  await page.getByLabel("IP 数字串").fill("25525511135");
  await expect(page.locator(".va-text-result")).toContainText("找到 2 个合法地址");
  await expect(page.locator(".va-text-result")).toContainText("255.255.11.135");
  await expect(page.locator(".va-text-result")).toContainText("255.255.111.35");

  await page.locator(".va-ip-control input").nth(0).fill("1");
  await page.locator(".va-ip-control input").nth(1).fill("0");
  await page.locator(".va-ip-control input").nth(2).fill("10");
  await page.locator(".va-ip-control input").nth(3).fill("23");
  await expect(page.getByLabel("IP 数字串")).toHaveValue("1.0.10.23");
  await expect(page.locator(".va-text-result")).toContainText("1.0.10.23");
});

test("lake counting uses a clickable grid editor", async ({ page }) => {
  await expectDetailPageReady(page, "lake-counting");
  await expect(page.locator(".va-lake-matrix-editor")).toBeVisible();
  await expect(page.locator(".va-lake-cell")).toHaveCount(20);
  await expect(page.locator(".va-workbench-controls textarea")).toHaveCount(0);
  await expect(page.locator(".va-help")).toContainText("点击小格切换水域和陆地");

  await page.getByRole("button", { name: "运行" }).click();
  await expect(page.locator(".va-status")).toContainText("连通块数量：2");
  await page.locator(".va-lake-cell").nth(7).click();
  await page.getByRole("button", { name: "运行" }).click();
  await expect(page.locator(".va-status")).toContainText("连通块数量：1");
});

test("escape pathfinding uses a clickable mode grid editor", async ({ page }) => {
  await expectDetailPageReady(page, "escape-pathfinding");
  await expect(page.locator(".va-path-matrix-editor")).toBeVisible();
  await expect(page.locator(".va-path-cell")).toHaveCount(20);
  await expect(page.locator(".va-workbench-controls textarea")).toHaveCount(0);
  await expect(page.locator(".va-help")).toContainText("先选择起点、终点、障碍或空地");

  await page.getByRole("button", { name: "运行" }).click();
  await expect(page.locator(".va-status")).toContainText("最短路径长度：6");
  await page.getByRole("button", { name: "终点", exact: true }).click();
  await page.locator(".va-path-cell").nth(4).click();
  await page.getByRole("button", { name: "运行" }).click();
  await expect(page.locator(".va-status")).toContainText("最短路径长度：5");
});

test("invalid path map clears stale successful output", async ({ page }) => {
  await page.goto("/visual-algorithms/escape-pathfinding/");
  await expect(page.locator(".va-status")).toContainText("待运行");
  await expect(page.locator(".va-text-result")).toContainText("等待运行");
  await page.getByRole("button", { name: "运行" }).click();
  await expect(page.locator(".va-status")).toContainText("已完成");
  await expectVisualOutput(page);

  await page.getByRole("button", { name: "空地", exact: true }).click();
  await page.locator(".va-path-cell").nth(13).click();
  await page.getByRole("button", { name: "运行" }).click();
  await expect(page.locator(".va-status")).toContainText("地图必须包含 S 和 E");
  await expect(page.locator(".va-text-result")).toContainText("等待运行");
  await expect(page.locator(".va-playback")).toHaveCount(0);
});
