import "./styles.css";
import type { Priority, Task, TaskDraft, TaskFilters, Theme } from "./types";
import { createTask, filterTasks, getStats, isOverdue, isPriority, sortTasks, toggleTask, updateTask, validateDraft } from "./tasks";
import type { DraftErrors } from "./tasks";
import { loadTasks, loadTheme, saveTasks, saveTheme } from "./storage";

function byId<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!(element instanceof HTMLElement)) {
    throw new Error(`Missing required element: #${id}`);
  }
  return element as T;
}

function createElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

const PRIORITY_LABELS: Record<Priority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

const themeToggle = byId<HTMLButtonElement>("theme-toggle");
const newTaskButton = byId<HTMLButtonElement>("new-task");
const todayDate = byId<HTMLParagraphElement>("today-date");
const totalCount = byId<HTMLElement>("total-count");
const completedCount = byId<HTMLElement>("completed-count");
const pendingCount = byId<HTMLElement>("pending-count");
const completionPercent = byId<HTMLElement>("completion-percent");
const progressBar = byId<HTMLElement>("progress-bar");
const progressFill = byId<HTMLElement>("progress-fill");
const progressCaption = byId<HTMLElement>("progress-caption");
const resultCount = byId<HTMLElement>("result-count");
const searchInput = byId<HTMLInputElement>("search");
const statusFilter = byId<HTMLSelectElement>("status-filter");
const priorityFilter = byId<HTMLSelectElement>("priority-filter");
const taskList = byId<HTMLUListElement>("task-list");
const emptyState = byId<HTMLElement>("empty-state");
const emptyTitle = byId<HTMLElement>("empty-title");
const emptyMessage = byId<HTMLElement>("empty-message");
const emptyAction = byId<HTMLButtonElement>("empty-action");
const boardTitle = byId<HTMLElement>("board-title");
const statusRegion = byId<HTMLElement>("status");
const themeColorMeta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');

const dialog = byId<HTMLDialogElement>("task-dialog");
const taskForm = byId<HTMLFormElement>("task-form");
const dialogEyebrow = byId<HTMLElement>("dialog-eyebrow");
const dialogTitle = byId<HTMLElement>("dialog-title");
const dialogSubmit = byId<HTMLButtonElement>("dialog-submit");
const dialogClose = byId<HTMLButtonElement>("dialog-close");
const dialogCancel = byId<HTMLButtonElement>("dialog-cancel");
const titleInput = byId<HTMLInputElement>("task-title");
const descriptionInput = byId<HTMLTextAreaElement>("task-description");
const priorityInput = byId<HTMLSelectElement>("task-priority");
const dueDateInput = byId<HTMLInputElement>("task-due");

let tasks: Task[] = loadTasks();
let editingId: string | null = null;

const filters: TaskFilters = {
  status: "all",
  priority: "all",
  query: "",
};

const fieldErrors: Array<{
  field: keyof DraftErrors;
  input: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
  message: HTMLElement;
}> = [
  { field: "title", input: titleInput, message: byId("title-error") },
  { field: "description", input: descriptionInput, message: byId("description-error") },
  { field: "priority", input: priorityInput, message: byId("priority-error") },
  { field: "dueDate", input: dueDateInput, message: byId("due-error") },
];

function announce(message: string): void {
  statusRegion.textContent = "";
  window.setTimeout(() => {
    statusRegion.textContent = message;
  }, 30);
}

function pluralizeTasks(count: number): string {
  return count === 1 ? "1 task" : `${count} tasks`;
}

function formatToday(): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());
}

function formatDueDate(dueDate: string): string {
  const date = new Date(`${dueDate}T00:00:00`);
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" as const }),
  }).format(date);
}

function commit(nextTasks: Task[]): void {
  tasks = nextTasks;
  const saved = saveTasks(tasks);
  render();
  if (!saved) {
    announce("Changes are visible, but this browser could not save them.");
  }
}

function renderStats(): void {
  const stats = getStats(tasks);
  totalCount.textContent = String(stats.total);
  completedCount.textContent = String(stats.completed);
  pendingCount.textContent = String(stats.pending);
  completionPercent.textContent = `${stats.percent}%`;
  progressBar.setAttribute("aria-valuenow", String(stats.percent));
  progressFill.style.width = `${stats.percent}%`;
  progressCaption.textContent =
    stats.total === 0
      ? "No tasks yet"
      : `${stats.completed} of ${stats.total} complete`;
}

function renderTaskActions(actions: HTMLElement, task: Task): void {
  const editButton = createElement("button", "task-action", "Edit");
  editButton.type = "button";
  editButton.dataset.action = "edit";
  editButton.setAttribute("aria-label", `Edit ${task.title}`);

  const deleteButton = createElement("button", "task-action task-action-danger", "Delete");
  deleteButton.type = "button";
  deleteButton.dataset.action = "delete";
  deleteButton.setAttribute("aria-label", `Delete ${task.title}`);

  actions.append(editButton, deleteButton);
}

function renderTask(task: Task): HTMLLIElement {
  const item = createElement("li", "task");
  if (task.completed) item.classList.add("is-complete");
  item.dataset.id = task.id;

  const checkLabel = createElement("label", "task-check");
  const checkbox = createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = task.completed;
  checkbox.setAttribute(
    "aria-label",
    task.completed ? `Mark ${task.title} as pending` : `Mark ${task.title} as completed`,
  );
  const checkBox = createElement("span", "task-check-box");
  checkBox.setAttribute("aria-hidden", "true");
  checkLabel.append(checkbox, checkBox);

  const body = createElement("div", "task-body");
  body.append(createElement("h3", "task-title", task.title));

  if (task.description) {
    body.append(createElement("p", "task-description", task.description));
  }

  const meta = createElement("div", "task-meta");
  const priority = createElement(
    "span",
    `task-priority task-priority-${task.priority}`,
  );
  const priorityDot = createElement("span", "priority-dot");
  priorityDot.setAttribute("aria-hidden", "true");
  priority.append(priorityDot, document.createTextNode(`${PRIORITY_LABELS[task.priority]} priority`));

  const overdue = isOverdue(task);
  const due = createElement("span", "task-due");
  if (overdue) due.classList.add("is-overdue");
  due.append(
    document.createTextNode(
      task.dueDate ? `${overdue ? "Overdue" : "Due"} ${formatDueDate(task.dueDate)}` : "No due date",
    ),
  );

  meta.append(priority, due);
  body.append(meta);

  const actions = createElement("div", "task-actions");
  renderTaskActions(actions, task);

  item.append(checkLabel, body, actions);
  return item;
}

function renderTasks(): void {
  const visibleTasks = sortTasks(filterTasks(tasks, filters));
  const hasFilters =
    filters.status !== "all" || filters.priority !== "all" || filters.query.trim() !== "";

  taskList.replaceChildren(...visibleTasks.map(renderTask));

  const filtered = visibleTasks.length !== tasks.length;
  resultCount.textContent = filtered
    ? `${visibleTasks.length} of ${pluralizeTasks(tasks.length)}`
    : pluralizeTasks(tasks.length);

  emptyState.hidden = visibleTasks.length > 0;
  if (emptyState.hidden) return;

  if (tasks.length === 0) {
    emptyTitle.textContent = "No tasks yet";
    emptyMessage.textContent = "Add your first task to start planning your day.";
    emptyAction.textContent = "Add a task";
    emptyAction.dataset.mode = "add";
  } else if (hasFilters) {
    emptyTitle.textContent = "No matching tasks";
    emptyMessage.textContent = "Try another search, or reset the status and priority filters.";
    emptyAction.textContent = "Clear filters";
    emptyAction.dataset.mode = "clear";
  }
}

function render(): void {
  renderStats();
  renderTasks();
}

function applyTheme(theme: Theme, persist: boolean): void {
  document.documentElement.dataset.theme = theme;
  const isDark = theme === "dark";
  themeToggle.setAttribute("aria-label", isDark ? "Switch to light theme" : "Switch to dark theme");
  themeToggle.setAttribute("title", isDark ? "Switch to light theme" : "Switch to dark theme");
  if (themeColorMeta) {
    themeColorMeta.content = isDark ? "#151716" : "#f6f4ef";
  }
  if (persist) saveTheme(theme);
}

function currentTheme(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function clearErrors(): void {
  for (const { input, message } of fieldErrors) {
    message.textContent = "";
    input.removeAttribute("aria-invalid");
  }
}

function showErrors(errors: DraftErrors): void {
  let firstInvalid: HTMLElement | null = null;
  for (const { field, input, message } of fieldErrors) {
    const error = errors[field];
    if (error) {
      message.textContent = error;
      input.setAttribute("aria-invalid", "true");
      firstInvalid ??= input;
    } else {
      message.textContent = "";
      input.removeAttribute("aria-invalid");
    }
  }
  firstInvalid?.focus();
}

function readDraft(): TaskDraft {
  return {
    title: titleInput.value,
    description: descriptionInput.value,
    priority: isPriority(priorityInput.value) ? priorityInput.value : "medium",
    dueDate: dueDateInput.value,
  };
}

function openTaskDialog(task: Task | null): void {
  editingId = task ? task.id : null;
  taskForm.reset();
  clearErrors();

  if (task) {
    titleInput.value = task.title;
    descriptionInput.value = task.description;
    priorityInput.value = task.priority;
    dueDateInput.value = task.dueDate ?? "";
  }

  dialogEyebrow.textContent = task ? "Edit task" : "New task";
  dialogTitle.textContent = task ? "Edit task" : "Add a task";
  dialogSubmit.textContent = task ? "Save changes" : "Add task";

  dialog.showModal();
  titleInput.focus();
}

function closeTaskDialog(): void {
  dialog.close();
}

function findTask(id: string): Task | undefined {
  return tasks.find((task) => task.id === id);
}

newTaskButton.addEventListener("click", () => openTaskDialog(null));
dialogClose.addEventListener("click", closeTaskDialog);
dialogCancel.addEventListener("click", closeTaskDialog);

dialog.addEventListener("close", () => {
  editingId = null;
});

dueDateInput.addEventListener("input", () => {
  if (dueDateInput.value === "") dueDateInput.removeAttribute("aria-invalid");
});

taskForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const draft = readDraft();
  const errors = validateDraft(draft);

  if (Object.keys(errors).length > 0) {
    showErrors(errors);
    return;
  }

  if (editingId !== null) {
    const existing = findTask(editingId);
    if (existing) {
      const updated = updateTask(existing, draft);
      commit(tasks.map((task) => (task.id === existing.id ? updated : task)));
      announce("Task updated.");
    }
  } else {
    const created = createTask(draft);
    commit([created, ...tasks]);
    announce("Task added.");
  }

  dialog.close();
});

taskList.addEventListener("change", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLInputElement) || target.type !== "checkbox") return;
  const id = target.closest<HTMLElement>("li.task")?.dataset.id;
  if (!id) return;

  tasks = tasks.map((task) => (task.id === id ? toggleTask(task) : task));
  const saved = saveTasks(tasks);
  render();
  announce("Task status updated.");
  if (!saved) announce("This browser could not save the change.");
});

taskList.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  const button = target.closest<HTMLButtonElement>("button[data-action]");
  if (!button) return;
  const id = button.closest<HTMLElement>("li.task")?.dataset.id;
  if (!id) return;
  const task = findTask(id);
  if (!task) return;

  if (button.dataset.action === "edit") {
    openTaskDialog(task);
    return;
  }

  if (button.dataset.action === "delete") {
    const confirmed = window.confirm(`Delete “${task.title}”? This cannot be undone.`);
    if (!confirmed) return;
    commit(tasks.filter((entry) => entry.id !== id));
    announce("Task deleted.");
    boardTitle.focus();
  }
});

emptyAction.addEventListener("click", () => {
  if (emptyAction.dataset.mode === "clear") {
    searchInput.value = "";
    statusFilter.value = "all";
    priorityFilter.value = "all";
    filters.query = "";
    filters.status = "all";
    filters.priority = "all";
    renderTasks();
    announce("Filters cleared.");
    searchInput.focus();
    return;
  }
  openTaskDialog(null);
});

searchInput.addEventListener("input", () => {
  filters.query = searchInput.value;
  renderTasks();
});

statusFilter.addEventListener("change", () => {
  const value = statusFilter.value;
  filters.status = value === "active" || value === "completed" ? value : "all";
  renderTasks();
});

priorityFilter.addEventListener("change", () => {
  const value = priorityFilter.value;
  filters.priority = isPriority(value) ? value : "all";
  renderTasks();
});

themeToggle.addEventListener("click", () => {
  const nextTheme: Theme = currentTheme() === "dark" ? "light" : "dark";
  applyTheme(nextTheme, true);
  announce(nextTheme === "dark" ? "Dark theme enabled." : "Light theme enabled.");
});

document.addEventListener("keydown", (event) => {
  if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
  const target = event.target;
  if (target instanceof HTMLElement) {
    const tag = target.tagName;
    if (target.isContentEditable || tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
      return;
    }
  }
  if (dialog.open) return;
  if (event.key.toLowerCase() === "n") {
    event.preventDefault();
    openTaskDialog(null);
  }
});

boardTitle.tabIndex = -1;
todayDate.textContent = formatToday();
applyTheme(loadTheme() ?? currentTheme(), false);
render();
