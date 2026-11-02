import { describe, expect, it } from "vitest";
import {
  createTask,
  filterTasks,
  getStats,
  isOverdue,
  isValidDateString,
  removeTask,
  sortTasks,
  toggleTask,
  updateTask,
  validateDraft,
} from "./tasks";
import type { Priority, Task, TaskDraft } from "./types";

const NOW = new Date("2026-11-02T09:00:00.000Z");

function makeDraft(overrides: Partial<TaskDraft> = {}): TaskDraft {
  return {
    title: "Read chapter 4",
    description: "",
    priority: "medium",
    dueDate: "",
    ...overrides,
  };
}

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: "task-1",
    title: "Read chapter 4",
    description: "",
    priority: "medium",
    dueDate: null,
    completed: false,
    createdAt: "2026-11-01T10:00:00.000Z",
    updatedAt: "2026-11-01T10:00:00.000Z",
    ...overrides,
  };
}

describe("validateDraft", () => {
  it("accepts a complete draft", () => {
    expect(validateDraft(makeDraft({ dueDate: "2026-11-05" }))).toEqual({});
  });

  it("requires a non-empty title", () => {
    expect(validateDraft(makeDraft({ title: "" })).title).toBeTruthy();
    expect(validateDraft(makeDraft({ title: "   " })).title).toBeTruthy();
  });

  it("rejects an overlong title or description", () => {
    expect(validateDraft(makeDraft({ title: "a".repeat(121) })).title).toBeTruthy();
    expect(validateDraft(makeDraft({ description: "a".repeat(301) })).description).toBeTruthy();
  });

  it("rejects an unknown priority", () => {
    const draft = makeDraft({ priority: "urgent" as unknown as Priority });
    expect(validateDraft(draft).priority).toBeTruthy();
  });

  it("rejects impossible or malformed dates", () => {
    expect(validateDraft(makeDraft({ dueDate: "2026-02-30" })).dueDate).toBeTruthy();
    expect(validateDraft(makeDraft({ dueDate: "11/05/2026" })).dueDate).toBeTruthy();
    expect(validateDraft(makeDraft({ dueDate: "2026-11-05" })).dueDate).toBeUndefined();
  });
});

describe("isValidDateString", () => {
  it("recognises real calendar dates only", () => {
    expect(isValidDateString("2024-02-29")).toBe(true);
    expect(isValidDateString("2025-02-29")).toBe(false);
    expect(isValidDateString("2026-13-01")).toBe(false);
    expect(isValidDateString("2026-1-01")).toBe(false);
  });
});

describe("createTask", () => {
  it("trims input, starts pending, and assigns an id", () => {
    const task = createTask(
      makeDraft({
        title: "  Write summary  ",
        description: "  Two paragraphs  ",
        priority: "high",
        dueDate: "2026-11-04",
      }),
      NOW,
    );

    expect(task.title).toBe("Write summary");
    expect(task.description).toBe("Two paragraphs");
    expect(task.priority).toBe("high");
    expect(task.dueDate).toBe("2026-11-04");
    expect(task.completed).toBe(false);
    expect(task.id).not.toBe("");
    expect(task.createdAt).toBe(NOW.toISOString());
    expect(task.updatedAt).toBe(NOW.toISOString());
  });

  it("stores an empty due date as null", () => {
    expect(createTask(makeDraft(), NOW).dueDate).toBeNull();
  });

  it("creates unique ids", () => {
    expect(createTask(makeDraft(), NOW).id).not.toBe(createTask(makeDraft(), NOW).id);
  });

  it("refuses invalid drafts", () => {
    expect(() => createTask(makeDraft({ title: " " }), NOW)).toThrow();
  });
});

describe("updateTask", () => {
  it("changes editable fields while preserving identity and status", () => {
    const task = makeTask({ completed: true });
    const updated = updateTask(
      task,
      makeDraft({ title: "Read chapter 5", priority: "high", dueDate: "2026-11-09" }),
      new Date("2026-11-03T12:00:00.000Z"),
    );

    expect(updated.id).toBe(task.id);
    expect(updated.createdAt).toBe(task.createdAt);
    expect(updated.completed).toBe(true);
    expect(updated.title).toBe("Read chapter 5");
    expect(updated.priority).toBe("high");
    expect(updated.dueDate).toBe("2026-11-09");
    expect(updated.updatedAt).toBe("2026-11-03T12:00:00.000Z");
  });
});

describe("toggleTask", () => {
  it("flips completion and updates the timestamp", () => {
    const task = makeTask();
    const completed = toggleTask(task, new Date("2026-11-03T08:00:00.000Z"));
    expect(completed.completed).toBe(true);
    expect(completed.updatedAt).toBe("2026-11-03T08:00:00.000Z");
    expect(toggleTask(completed).completed).toBe(false);
  });
});

describe("removeTask", () => {
  it("removes only the matching task", () => {
    const tasks = [makeTask({ id: "a" }), makeTask({ id: "b" })];
    expect(removeTask(tasks, "a").map((task) => task.id)).toEqual(["b"]);
    expect(tasks).toHaveLength(2);
  });
});

describe("filterTasks", () => {
  const tasks = [
    makeTask({ id: "a", title: "Finish essay", priority: "high" }),
    makeTask({ id: "b", title: "Review notes", priority: "low", completed: true }),
    makeTask({ id: "c", title: "Plan study week", priority: "high", description: "Essay outline" }),
  ];

  it("filters by status", () => {
    const ids = filterTasks(tasks, { status: "completed", priority: "all", query: "" }).map((t) => t.id);
    expect(ids).toEqual(["b"]);
    expect(filterTasks(tasks, { status: "active", priority: "all", query: "" })).toHaveLength(2);
  });

  it("filters by priority", () => {
    expect(
      filterTasks(tasks, { status: "all", priority: "high", query: "" }).map((t) => t.id),
    ).toEqual(["a", "c"]);
  });

  it("searches titles case-insensitively and ignores descriptions", () => {
    expect(filterTasks(tasks, { status: "all", priority: "all", query: "ESSAY" }).map((t) => t.id)).toEqual([
      "a",
    ]);
    expect(filterTasks(tasks, { status: "all", priority: "all", query: "outline" })).toEqual([]);
  });

  it("combines status, priority, and query", () => {
    expect(
      filterTasks(tasks, { status: "active", priority: "high", query: "plan" }).map((t) => t.id),
    ).toEqual(["c"]);
  });
});

describe("sortTasks", () => {
  it("puts pending first, then priority, due date, and newest", () => {
    const tasks = [
      makeTask({ id: "completed", completed: true, priority: "high" }),
      makeTask({ id: "low", priority: "low", dueDate: "2026-11-01" }),
      makeTask({ id: "high-late", priority: "high", dueDate: "2026-11-10" }),
      makeTask({ id: "high-early", priority: "high", dueDate: "2026-11-05" }),
      makeTask({ id: "high-none", priority: "high", dueDate: null }),
    ];

    expect(sortTasks(tasks).map((task) => task.id)).toEqual([
      "high-early",
      "high-late",
      "high-none",
      "low",
      "completed",
    ]);
  });

  it("does not mutate the input array", () => {
    const tasks = [makeTask({ id: "a", completed: true }), makeTask({ id: "b" })];
    const sorted = sortTasks(tasks);
    expect(sorted).not.toBe(tasks);
    expect(tasks.map((task) => task.id)).toEqual(["a", "b"]);
  });
});

describe("getStats", () => {
  it("reports zeros for an empty list", () => {
    expect(getStats([])).toEqual({ total: 0, completed: 0, pending: 0, percent: 0 });
  });

  it("counts and rounds completion percentage", () => {
    expect(
      getStats([
        makeTask({ id: "a", completed: true }),
        makeTask({ id: "b", completed: true }),
        makeTask({ id: "c" }),
      ]),
    ).toEqual({ total: 3, completed: 2, pending: 1, percent: 67 });
  });
});

describe("isOverdue", () => {
  const today = new Date(2026, 10, 2, 12, 0, 0);

  it("is false without a due date or when completed", () => {
    expect(isOverdue(makeTask(), today)).toBe(false);
    expect(isOverdue(makeTask({ dueDate: "2026-10-30", completed: true }), today)).toBe(false);
  });

  it("compares against the local calendar date", () => {
    expect(isOverdue(makeTask({ dueDate: "2026-11-01" }), today)).toBe(true);
    expect(isOverdue(makeTask({ dueDate: "2026-11-02" }), today)).toBe(false);
    expect(isOverdue(makeTask({ dueDate: "2026-11-09" }), today)).toBe(false);
  });
});
