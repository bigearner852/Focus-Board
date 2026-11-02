import { mkdirSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { localDateKey } from "./helpers";

const SCREENSHOT_DIR = "docs/screenshots";

function seedTasks() {
  const now = Date.now();
  return [
    {
      id: "seed-1",
      title: "Finish statistics problem set",
      description: "Chapters 6–7, focus on the regression questions.",
      priority: "high",
      dueDate: localDateKey(2),
      completed: false,
      createdAt: new Date(now - 4 * 86_400_000).toISOString(),
      updatedAt: new Date(now - 4 * 86_400_000).toISOString(),
    },
    {
      id: "seed-2",
      title: "Review lecture notes",
      description: "Skim week 9 and flag anything that needs another pass.",
      priority: "medium",
      dueDate: localDateKey(0),
      completed: false,
      createdAt: new Date(now - 3 * 86_400_000).toISOString(),
      updatedAt: new Date(now - 3 * 86_400_000).toISOString(),
    },
    {
      id: "seed-3",
      title: "Read the attention paper",
      description: "",
      priority: "high",
      dueDate: localDateKey(-1),
      completed: false,
      createdAt: new Date(now - 2 * 86_400_000).toISOString(),
      updatedAt: new Date(now - 2 * 86_400_000).toISOString(),
    },
    {
      id: "seed-4",
      title: "Draft literature review outline",
      description: "Three sections, two sources each.",
      priority: "low",
      dueDate: null,
      completed: false,
      createdAt: new Date(now - 86_400_000).toISOString(),
      updatedAt: new Date(now - 86_400_000).toISOString(),
    },
    {
      id: "seed-5",
      title: "Submit lab report",
      description: "",
      priority: "medium",
      dueDate: localDateKey(-2),
      completed: true,
      createdAt: new Date(now - 5 * 86_400_000).toISOString(),
      updatedAt: new Date(now - 86_400_000).toISOString(),
    },
  ];
}

async function seedAndOpen(page: Page, theme: "light" | "dark"): Promise<void> {
  const tasks = seedTasks();
  await page.addInitScript(
    ({ seededTasks, seededTheme }) => {
      window.localStorage.setItem("focusboard.tasks.v1", JSON.stringify(seededTasks));
      window.localStorage.setItem("focusboard.theme", seededTheme);
    },
    { seededTasks: tasks, seededTheme: theme },
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "What deserves your focus?" })).toBeVisible();
  await expect(page.locator("li.task")).toHaveCount(5);
  await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
}

test.beforeAll(() => {
  mkdirSync(SCREENSHOT_DIR, { recursive: true });
});

test("capture desktop light", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await seedAndOpen(page, "light");
  await page.screenshot({ path: `${SCREENSHOT_DIR}/desktop-light.png`, fullPage: true });
});

test("capture desktop dark", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await seedAndOpen(page, "dark");
  await page.screenshot({ path: `${SCREENSHOT_DIR}/desktop-dark.png`, fullPage: true });
});

test("capture mobile light", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await seedAndOpen(page, "light");
  await page.screenshot({ path: `${SCREENSHOT_DIR}/mobile-light.png`, fullPage: true });
});
