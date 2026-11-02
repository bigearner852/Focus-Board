import { expect, test } from "@playwright/test";
import {
  addTask,
  expectStats,
  localDateKey,
  openApp,
  taskRow,
} from "./helpers";

test.describe("task management", () => {
  test("shows an empty board with totals at zero", async ({ page }) => {
    await openApp(page);

    await expect(page.getByRole("heading", { name: "No tasks yet" })).toBeVisible();
    await expect(page.getByText("Add your first task to start planning your day.")).toBeVisible();
    await expectStats(page, { total: 0, completed: 0, pending: 0, percent: 0 });
  });

  test("validates the add form without closing the dialog", async ({ page }) => {
    await openApp(page);
    await page.getByRole("button", { name: "New task", exact: true }).click();

    const dialog = page.getByRole("dialog", { name: "Add a task" });
    await dialog.getByRole("button", { name: "Add task", exact: true }).click();

    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("Enter a task title.")).toBeVisible();
    await expect(dialog.getByLabel("Title")).toHaveAttribute("aria-invalid", "true");
    await expect(page.locator("#total-count")).toHaveText("0");
  });

  test("creates a task with every field and persists it after reload", async ({ page }) => {
    await openApp(page);

    await addTask(page, {
      title: "Finish statistics problem set",
      description: "Chapters 6-7, regression questions.",
      priority: "high",
      dueDate: localDateKey(2),
    });

    const row = taskRow(page, "Finish statistics problem set");
    await expect(row).toBeVisible();
    await expect(row.getByText("Chapters 6-7, regression questions.")).toBeVisible();
    await expect(row.getByText("High priority")).toBeVisible();
    await expect(row.getByText(/^Due /)).toBeVisible();
    await expectStats(page, { total: 1, completed: 0, pending: 1, percent: 0 });

    await page.reload();
    await expect(row).toBeVisible();
    await expect(row.getByText("Chapters 6-7, regression questions.")).toBeVisible();
    await expectStats(page, { total: 1, completed: 0, pending: 1, percent: 0 });
  });

  test("toggles completion and updates counts and progress", async ({ page }) => {
    await openApp(page);
    await addTask(page, { title: "Read chapter 4", priority: "medium" });
    await addTask(page, { title: "Write summary", priority: "low" });

    const checkbox = taskRow(page, "Read chapter 4").getByRole("checkbox");
    await checkbox.check();

    await expect(checkbox).toBeChecked();
    await expect(taskRow(page, "Read chapter 4")).toHaveClass(/is-complete/);
    await expectStats(page, { total: 2, completed: 1, pending: 1, percent: 50 });

    await page.reload();
    await expect(taskRow(page, "Read chapter 4").getByRole("checkbox")).toBeChecked();
    await expectStats(page, { total: 2, completed: 1, pending: 1, percent: 50 });

    await taskRow(page, "Read chapter 4").getByRole("checkbox").uncheck();
    await expectStats(page, { total: 2, completed: 0, pending: 2, percent: 0 });
  });

  test("edited tasks keep their identity and persist changes", async ({ page }) => {
    await openApp(page);
    await addTask(page, { title: "Draft essay", priority: "low", dueDate: localDateKey(3) });

    await taskRow(page, "Draft essay").getByRole("button", { name: "Edit Draft essay" }).click();
    const dialog = page.getByRole("dialog", { name: "Edit task" });
    await expect(dialog.getByLabel("Title")).toHaveValue("Draft essay");

    await dialog.getByLabel("Title").fill("Draft final essay");
    await dialog.getByLabel(/Description/).fill("Argue both sides, then conclude.");
    await dialog.getByLabel("Priority").selectOption("high");
    await dialog.getByRole("button", { name: "Save changes", exact: true }).click();

    await expect(dialog).toBeHidden();
    await expect(taskRow(page, "Draft essay")).toHaveCount(0);
    const row = taskRow(page, "Draft final essay");
    await expect(row).toBeVisible();
    await expect(row.getByText("Argue both sides, then conclude.")).toBeVisible();
    await expect(row.getByText("High priority")).toBeVisible();
    await expectStats(page, { total: 1, completed: 0, pending: 1, percent: 0 });

    await page.reload();
    await expect(row).toBeVisible();
    await expect(row.getByText("High priority")).toBeVisible();
  });

  test("deletes a task after confirmation and keeps the rest", async ({ page }) => {
    await openApp(page);
    await addTask(page, { title: "Keep this task" });
    await addTask(page, { title: "Delete this task" });

    page.once("dialog", async (confirmation) => {
      expect(confirmation.message()).toContain("Delete this task");
      await confirmation.accept();
    });
    await taskRow(page, "Delete this task")
      .getByRole("button", { name: "Delete Delete this task" })
      .click();

    await expect(taskRow(page, "Delete this task")).toHaveCount(0);
    await expect(taskRow(page, "Keep this task")).toBeVisible();
    await expectStats(page, { total: 1, completed: 0, pending: 1, percent: 0 });

    await page.reload();
    await expect(taskRow(page, "Delete this task")).toHaveCount(0);
    await expect(taskRow(page, "Keep this task")).toBeVisible();
  });
});

test.describe("filtering and search", () => {
  test("filters by status and priority, and searches titles only", async ({ page }) => {
    await openApp(page);
    await addTask(page, {
      title: "Alpha assignment",
      description: "Unique description keyword: zebracrossing",
      priority: "high",
      dueDate: localDateKey(1),
    });
    await addTask(page, { title: "Beta reading", priority: "low" });
    await addTask(page, { title: "Gamma revision", priority: "high", dueDate: localDateKey(4) });

    await taskRow(page, "Beta reading").getByRole("checkbox").check();
    await expectStats(page, { total: 3, completed: 1, pending: 2, percent: 33 });

    await page.getByLabel("Status").selectOption("active");
    await expect(page.locator("li.task")).toHaveCount(2);
    await expect(taskRow(page, "Beta reading")).toHaveCount(0);
    await expect(page.locator("#result-count")).toHaveText("2 of 3 tasks");

    await page.locator(".toolbar").getByLabel("Priority").selectOption("high");
    await expect(page.locator("li.task")).toHaveCount(2);

    await page.getByLabel("Status").selectOption("all");
    await expect(page.locator("li.task")).toHaveCount(2);

    await page.locator(".toolbar").getByLabel("Priority").selectOption("low");
    await expect(page.locator("li.task")).toHaveCount(1);
    await expect(taskRow(page, "Beta reading")).toBeVisible();

    await page.locator(".toolbar").getByLabel("Priority").selectOption("all");
    await page.getByLabel("Search").fill("ALPHA");
    await expect(page.locator("li.task")).toHaveCount(1);
    await expect(taskRow(page, "Alpha assignment")).toBeVisible();

    await page.getByLabel("Search").fill("zebracrossing");
    await expect(page.locator("li.task")).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "No matching tasks" })).toBeVisible();

    await page.getByRole("button", { name: "Clear filters" }).click();
    await expect(page.locator("li.task")).toHaveCount(3);
    await expect(page.getByLabel("Search")).toHaveValue("");
    await expect(page.getByLabel("Status")).toHaveValue("all");
    await expect(page.locator(".toolbar").getByLabel("Priority")).toHaveValue("all");
  });

  test("marks past-due pending tasks as overdue", async ({ page }) => {
    await openApp(page);
    await addTask(page, { title: "Overdue task", dueDate: localDateKey(-1) });
    await addTask(page, { title: "Future task", dueDate: localDateKey(5) });

    await expect(taskRow(page, "Overdue task").locator(".task-due")).toHaveText(/^Overdue /);
    await expect(taskRow(page, "Future task").locator(".task-due")).toHaveText(/^Due /);

    await taskRow(page, "Overdue task").getByRole("checkbox").check();
    await expect(taskRow(page, "Overdue task").locator(".task-due")).not.toHaveClass(/is-overdue/);
  });
});

test.describe("theme and keyboard", () => {
  test("toggles and persists the theme", async ({ page }) => {
    await openApp(page);
    const html = page.locator("html");
    const initialTheme = await html.getAttribute("data-theme");
    const toggle = page.getByRole("button", { name: /Switch to (dark|light) theme/ });

    await toggle.click();
    const nextTheme = initialTheme === "dark" ? "light" : "dark";
    await expect(html).toHaveAttribute("data-theme", nextTheme);

    const storedTheme = await page.evaluate(() => window.localStorage.getItem("focusboard.theme"));
    expect(storedTheme).toBe(nextTheme);

    await page.reload();
    await expect(html).toHaveAttribute("data-theme", nextTheme);
  });

  test("supports N to add and Escape to close", async ({ page }) => {
    await openApp(page);
    await page.getByRole("heading", { name: "What deserves your focus?" }).click();
    await page.keyboard.press("n");

    const dialog = page.getByRole("dialog", { name: "Add a task" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByLabel("Title")).toBeFocused();

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(page.getByRole("button", { name: "New task", exact: true })).toBeFocused();
  });

  test("does not trigger the shortcut while typing", async ({ page }) => {
    await openApp(page);
    await addTask(page, { title: "Existing task" });
    await page.getByLabel("Search").fill("n");

    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.getByLabel("Search")).toHaveValue("n");
  });
});
