import { expect, type Page } from "@playwright/test";

export const APP_HEADING = "What deserves your focus?";

export interface TaskInput {
  title: string;
  description?: string;
  priority?: "low" | "medium" | "high";
  dueDate?: string;
}

export async function openApp(page: Page): Promise<void> {
  await page.goto("/");
  await page.evaluate(() => {
    window.localStorage.clear();
  });
  await page.reload();
  await expect(page.getByRole("heading", { name: APP_HEADING })).toBeVisible();
}

export async function addTask(page: Page, input: TaskInput): Promise<void> {
  await page.getByRole("button", { name: "New task", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Add a task" });
  await expect(dialog).toBeVisible();

  await dialog.getByLabel("Title").fill(input.title);
  if (input.description !== undefined) {
    await dialog.getByLabel(/Description/).fill(input.description);
  }
  if (input.priority !== undefined) {
    await dialog.getByLabel("Priority").selectOption(input.priority);
  }
  if (input.dueDate !== undefined) {
    await dialog.getByLabel(/Due date/).fill(input.dueDate);
  }

  await dialog.getByRole("button", { name: "Add task", exact: true }).click();
  await expect(dialog).toBeHidden();
}

export function taskRow(page: Page, title: string) {
  return page.locator("li.task").filter({
    has: page.getByRole("heading", { name: title, exact: true }),
  });
}

export async function expectStats(
  page: Page,
  expected: { total: number; completed: number; pending: number; percent: number },
): Promise<void> {
  await expect(page.locator("#total-count")).toHaveText(String(expected.total));
  await expect(page.locator("#completed-count")).toHaveText(String(expected.completed));
  await expect(page.locator("#pending-count")).toHaveText(String(expected.pending));
  await expect(page.locator("#completion-percent")).toHaveText(`${expected.percent}%`);
  await expect(page.locator("#progress-bar")).toHaveAttribute(
    "aria-valuenow",
    String(expected.percent),
  );
}

export function localDateKey(offsetDays = 0): string {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
