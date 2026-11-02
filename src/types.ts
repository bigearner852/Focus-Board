export const PRIORITIES = ["low", "medium", "high"] as const;

export type Priority = (typeof PRIORITIES)[number];

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  /** Calendar date in `YYYY-MM-DD` format, or null when no due date is set. */
  dueDate: string | null;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export type TaskDraft = Pick<Task, "title" | "description" | "priority"> & {
  /** Empty string means no due date was chosen. */
  dueDate: string;
};

export type StatusFilter = "all" | "active" | "completed";
export type PriorityFilter = "all" | Priority;

export interface TaskFilters {
  status: StatusFilter;
  priority: PriorityFilter;
  query: string;
}

export interface TaskStats {
  total: number;
  completed: number;
  pending: number;
  percent: number;
}

export type Theme = "light" | "dark";
