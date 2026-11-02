import { isPriority, isValidDateString } from "./tasks";
import type { Task, Theme } from "./types";

export const TASKS_STORAGE_KEY = "focusboard.tasks.v1";
export const THEME_STORAGE_KEY = "focusboard.theme";

export type StorageLike = Pick<Storage, "getItem" | "setItem">;

function getBrowserStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    // Storage can be blocked by browser privacy settings.
    return null;
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

/** Convert one unknown value from storage into a Task, or null if unusable. */
function parseStoredTask(value: unknown): Task | null {
  const record = asRecord(value);
  if (!record) return null;

  const { id, title, priority, completed, description, dueDate, createdAt, updatedAt } = record;

  if (typeof id !== "string" || id.trim() === "") return null;
  if (typeof title !== "string" || title.trim() === "") return null;
  if (!isPriority(priority)) return null;
  if (typeof createdAt !== "string") return null;

  return {
    id,
    title: title.trim(),
    description: typeof description === "string" ? description : "",
    priority,
    dueDate: typeof dueDate === "string" && isValidDateString(dueDate) ? dueDate : null,
    completed: typeof completed === "boolean" ? completed : false,
    createdAt,
    updatedAt: typeof updatedAt === "string" ? updatedAt : createdAt,
  };
}

/** Parse a raw localStorage value. Never throws; malformed data yields an empty list. */
export function parseTasks(raw: string | null): Task[] {
  if (!raw) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }

  if (!Array.isArray(parsed)) return [];

  const tasks: Task[] = [];
  const seenIds = new Set<string>();
  for (const entry of parsed) {
    const task = parseStoredTask(entry);
    if (task && !seenIds.has(task.id)) {
      seenIds.add(task.id);
      tasks.push(task);
    }
  }
  return tasks;
}

export function loadTasks(storage: StorageLike | null = getBrowserStorage()): Task[] {
  if (!storage) return [];
  try {
    return parseTasks(storage.getItem(TASKS_STORAGE_KEY));
  } catch {
    return [];
  }
}

/** Persist tasks. Returns false when storage is unavailable or full. */
export function saveTasks(tasks: readonly Task[], storage: StorageLike | null = getBrowserStorage()): boolean {
  if (!storage) return false;
  try {
    storage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
    return true;
  } catch {
    return false;
  }
}

export function loadTheme(storage: StorageLike | null = getBrowserStorage()): Theme | null {
  if (!storage) return null;
  try {
    const theme = storage.getItem(THEME_STORAGE_KEY);
    return theme === "light" || theme === "dark" ? theme : null;
  } catch {
    return null;
  }
}

export function saveTheme(theme: Theme, storage: StorageLike | null = getBrowserStorage()): void {
  if (!storage) return;
  try {
    storage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Theme persistence is a convenience; ignore unavailable storage.
  }
}
