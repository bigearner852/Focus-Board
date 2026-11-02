import { describe, expect, it } from "vitest";
import {
  loadTasks,
  loadTheme,
  parseTasks,
  saveTasks,
  saveTheme,
  TASKS_STORAGE_KEY,
  THEME_STORAGE_KEY,
} from "./storage";
import type { StorageLike } from "./storage";
import type { Task } from "./types";

class MemoryStorage implements StorageLike {
  private readonly entries = new Map<string, string>();
  failReads = false;
  failWrites = false;

  getItem(key: string): string | null {
    if (this.failReads) throw new Error("Storage blocked");
    return this.entries.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    if (this.failWrites) throw new Error("Quota exceeded");
    this.entries.set(key, value);
  }

  seed(key: string, value: string): void {
    this.entries.set(key, value);
  }
}

const TASK: Task = {
  id: "task-1",
  title: "Finish problem set",
  description: "Questions 1–8",
  priority: "high",
  dueDate: "2026-11-04",
  completed: false,
  createdAt: "2026-11-01T08:00:00.000Z",
  updatedAt: "2026-11-01T08:00:00.000Z",
};

describe("task persistence", () => {
  it("round-trips tasks through storage", () => {
    const storage = new MemoryStorage();
    expect(saveTasks([TASK], storage)).toBe(true);
    expect(loadTasks(storage)).toEqual([TASK]);
  });

  it("returns an empty list when nothing is stored", () => {
    expect(loadTasks(new MemoryStorage())).toEqual([]);
  });

  it("survives corrupted JSON and non-array payloads", () => {
    const storage = new MemoryStorage();
    storage.seed(TASKS_STORAGE_KEY, "{not json");
    expect(loadTasks(storage)).toEqual([]);

    storage.seed(TASKS_STORAGE_KEY, JSON.stringify({ tasks: [TASK] }));
    expect(loadTasks(storage)).toEqual([]);

    storage.seed(TASKS_STORAGE_KEY, "null");
    expect(loadTasks(storage)).toEqual([]);
  });

  it("drops malformed entries but keeps valid ones", () => {
    const raw = JSON.stringify([
      TASK,
      null,
      { ...TASK, id: "missing-title", title: "" },
      { ...TASK, id: "bad-priority", priority: "urgent" },
      "not-an-object",
      { ...TASK, id: "tolerated", title: "  Tolerated entry  ", description: undefined, completed: "yes", dueDate: "2026-02-30" },
      { ...TASK },
    ]);

    expect(parseTasks(raw)).toEqual([
      TASK,
      {
        ...TASK,
        id: "tolerated",
        title: "Tolerated entry",
        description: "",
        completed: false,
        dueDate: null,
      },
    ]);
  });

  it("returns an empty list when reading throws", () => {
    const storage = new MemoryStorage();
    storage.failReads = true;
    expect(loadTasks(storage)).toEqual([]);
  });

  it("reports a failed write instead of throwing", () => {
    const storage = new MemoryStorage();
    storage.failWrites = true;
    expect(saveTasks([TASK], storage)).toBe(false);
  });

  it("handles unavailable storage", () => {
    expect(loadTasks(null)).toEqual([]);
    expect(saveTasks([TASK], null)).toBe(false);
  });
});

describe("theme persistence", () => {
  it("round-trips a valid theme", () => {
    const storage = new MemoryStorage();
    saveTheme("dark", storage);
    expect(storage.getItem(THEME_STORAGE_KEY)).toBe("dark");
    expect(loadTheme(storage)).toBe("dark");
  });

  it("ignores unknown or unreadable values", () => {
    const storage = new MemoryStorage();
    storage.seed(THEME_STORAGE_KEY, "purple");
    expect(loadTheme(storage)).toBeNull();

    storage.failReads = true;
    expect(loadTheme(storage)).toBeNull();
  });

  it("does not throw when storage is unavailable", () => {
    expect(() => saveTheme("light", null)).not.toThrow();
    expect(loadTheme(null)).toBeNull();
  });
});
