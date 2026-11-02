import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { addTask, localDateKey, openApp } from "./helpers";

function seriousViolations(
  violations: Awaited<ReturnType<AxeBuilder["analyze"]>>["violations"],
) {
  return violations.filter((violation) => violation.impact === "serious" || violation.impact === "critical");
}

test("board has no serious or critical accessibility violations", async ({ page }) => {
  await openApp(page);
  await addTask(page, {
    title: "Accessible task",
    description: "Includes a description and a due date.",
    priority: "high",
    dueDate: localDateKey(2),
  });
  await addTask(page, { title: "Completed task" });
  await page.getByRole("checkbox").first().check();

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();

  expect(seriousViolations(results.violations), JSON.stringify(results.violations, null, 2)).toEqual([]);
});

test("task dialog has no serious or critical accessibility violations", async ({ page }) => {
  await openApp(page);
  await page.getByRole("button", { name: "New task", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Add a task" })).toBeVisible();

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();

  expect(seriousViolations(results.violations), JSON.stringify(results.violations, null, 2)).toEqual([]);
});
