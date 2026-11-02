import { expect, test } from "@playwright/test";
import { addTask, localDateKey, openApp } from "./helpers";

const VIEWPORTS = [
  { name: "mobile", width: 390, height: 844 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 900 },
];

for (const viewport of VIEWPORTS) {
  test(`lays out without horizontal overflow at ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await openApp(page);
    await addTask(page, {
      title: "Measure the viewport",
      description: "A task long enough to exercise wrapping on narrow screens.",
      priority: "high",
      dueDate: localDateKey(2),
    });

    await expect(page.getByRole("heading", { name: "What deserves your focus?" })).toBeVisible();
    await expect(page.getByRole("button", { name: "New task", exact: true })).toBeVisible();
    await expect(page.getByLabel("Search")).toBeVisible();
    await expect(page.getByLabel("Status")).toBeVisible();
    await expect(page.locator(".toolbar").getByLabel("Priority")).toBeVisible();
    await expect(page.locator("#progress-bar")).toBeVisible();
    await expect(page.getByRole("button", { name: "Edit Measure the viewport" })).toBeVisible();

    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
      bodyScrollWidth: document.body.scrollWidth,
    }));
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.innerWidth + 1);
    expect(overflow.bodyScrollWidth).toBeLessThanOrEqual(overflow.innerWidth + 1);

    const headerBox = await page.locator(".site-header").boundingBox();
    expect(headerBox).not.toBeNull();
    expect(headerBox!.x).toBeGreaterThanOrEqual(0);
    expect(headerBox!.x + headerBox!.width).toBeLessThanOrEqual(viewport.width + 1);

    const rows = await page.locator("li.task").count();
    expect(rows).toBe(1);

    const actionsVisible = await page
      .getByRole("button", { name: "Edit Measure the viewport" })
      .isVisible();
    expect(actionsVisible).toBe(true);
  });
}

test("uses a single-column dialog form on very narrow screens", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await openApp(page);
  await page.getByRole("button", { name: "New task", exact: true }).click();

  const dialog = page.getByRole("dialog", { name: "Add a task" });
  await expect(dialog).toBeVisible();

  const dialogBox = await dialog.boundingBox();
  expect(dialogBox).not.toBeNull();
  expect(dialogBox!.x).toBeGreaterThanOrEqual(0);
  expect(dialogBox!.x + dialogBox!.width).toBeLessThanOrEqual(321);

  const priorityBox = await dialog.getByLabel("Priority").boundingBox();
  const dueBox = await dialog.getByLabel(/Due date/).boundingBox();
  expect(priorityBox).not.toBeNull();
  expect(dueBox).not.toBeNull();
  // The two fields stack at 320px, so the date field starts below the priority field.
  expect(dueBox!.y).toBeGreaterThan(priorityBox!.y);
});
