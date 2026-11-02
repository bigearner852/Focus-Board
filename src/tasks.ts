import { PRIORITIES } from "./types";
import type { Priority, Task, TaskDraft, TaskFilters, TaskStats } from "./types";

export const TITLE_MAX_LENGTH = 120;
export const DESCRIPTION_MAX_LENGTH = 300;

export type DraftErrors = Partial<Record<"title" | "description" | "priority" | "dueDate", string>>;

const PRIORITY_RANK: Record<Priority, number> = { high: 0, medium: 1, low: 2 };
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function isPriority(value: unknown): value is Priority {
  return typeof value === "string" && (PRIORITIES as readonly string[]).includes(value);
}

/** True only for real calendar dates expressed as `YYYY-MM-DD`. */
export function isValidDateString(value: string): boolean {
  if (!DATE_PATTERN.test(value)) return false;
  const [yearPart, monthPart, dayPart] = value.split("-");
  if (yearPart === undefined || monthPart === undefined || dayPart === undefined) return false;
  const year = Number(yearPart);
  const month = Number(monthPart);
  const day = Number(dayPart);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function validateDraft(draft: TaskDraft): DraftErrors {
  const errors: DraftErrors = {};
  const title = draft.title.trim();

  if (title.length === 0) {
    errors.title = "Enter a task title.";
  } else if (title.length > TITLE_MAX_LENGTH) {
    errors.title = `Keep the title under ${TITLE_MAX_LENGTH} characters.`;
  }

  if (draft.description.length > DESCRIPTION_MAX_LENGTH) {
    errors.description = `Keep the description under ${DESCRIPTION_MAX_LENGTH} characters.`;
  }

  if (!isPriority(draft.priority)) {
    errors.priority = "Choose a priority.";
  }

  if (draft.dueDate !== "" && !isValidDateString(draft.dueDate)) {
    errors.dueDate = "Enter a valid due date.";
  }

  return errors;
}

function createId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const random = Math.random().toString(36).slice(2, 10);
  return `task-${Date.now().toString(36)}-${random}`;
}

function normalizeDueDate(dueDate: string): string | null {
  return dueDate.trim() === "" ? null : dueDate.trim();
}

function assertValid(draft: TaskDraft): void {
  if (Object.keys(validateDraft(draft)).length > 0) {
    throw new Error("Cannot save a task from an invalid draft.");
  }
}

export function createTask(draft: TaskDraft, now: Date = new Date()): Task {
  assertValid(draft);
  const timestamp = now.toISOString();
  return {
    id: createId(),
    title: draft.title.trim(),
    description: draft.description.trim(),
    priority: draft.priority,
    dueDate: normalizeDueDate(draft.dueDate),
    completed: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function updateTask(task: Task, draft: TaskDraft, now: Date = new Date()): Task {
  assertValid(draft);
  return {
    ...task,
    title: draft.title.trim(),
    description: draft.description.trim(),
    priority: draft.priority,
    dueDate: normalizeDueDate(draft.dueDate),
    updatedAt: now.toISOString(),
  };
}

export function toggleTask(task: Task, now: Date = new Date()): Task {
  return { ...task, completed: !task.completed, updatedAt: now.toISOString() };
}

export function removeTask(tasks: readonly Task[], id: string): Task[] {
  return tasks.filter((task) => task.id !== id);
}

export function filterTasks(tasks: readonly Task[], filters: TaskFilters): Task[] {
  const query = filters.query.trim().toLowerCase();
  return tasks.filter((task) => {
    if (filters.status === "active" && task.completed) return false;
    if (filters.status === "completed" && !task.completed) return false;
    if (filters.priority !== "all" && task.priority !== filters.priority) return false;
    if (query.length > 0 && !task.title.toLowerCase().includes(query)) return false;
    return true;
  });
}

/** Pending tasks first, then by priority, due date, and creation order. */
export function sortTasks(tasks: readonly Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    const priorityDifference = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    if (priorityDifference !== 0) return priorityDifference;

    if (a.dueDate !== b.dueDate) {
      if (a.dueDate === null) return 1;
      if (b.dueDate === null) return -1;
      return a.dueDate.localeCompare(b.dueDate);
    }

    return b.createdAt.localeCompare(a.createdAt);
  });
}

export function getStats(tasks: readonly Task[]): TaskStats {
  const total = tasks.length;
  const completed = tasks.filter((task) => task.completed).length;
  return {
    total,
    completed,
    pending: total - completed,
    percent: total === 0 ? 0 : Math.round((completed / total) * 100),
  };
}

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function isOverdue(task: Task, today: Date = new Date()): boolean {
  if (task.completed || task.dueDate === null) return false;
  return task.dueDate < toDateKey(today);
}
