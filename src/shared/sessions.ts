export type SessionCategory = {
  id: string;
  name: string;
  description: string;
  tabCount: number;
  lastSavedLabel: string;
  status: "ready" | "empty" | "needs-review";
};

export const defaultCategories: SessionCategory[] = [
  {
    id: "work",
    name: "Work",
    description: "Active tasks, dashboards and operational pages.",
    tabCount: 0,
    lastSavedLabel: "Not saved yet",
    status: "empty"
  },
  {
    id: "research",
    name: "Research",
    description: "Investigations, docs and notes worth restoring later.",
    tabCount: 0,
    lastSavedLabel: "Not saved yet",
    status: "empty"
  },
  {
    id: "entertainment",
    name: "Entertainment",
    description: "Media, streams and relaxing browser contexts.",
    tabCount: 0,
    lastSavedLabel: "Not saved yet",
    status: "empty"
  },
  {
    id: "projects",
    name: "Projects",
    description: "Project-specific browser contexts.",
    tabCount: 0,
    lastSavedLabel: "Not saved yet",
    status: "empty"
  },
  {
    id: "inbox",
    name: "Later / Inbox",
    description: "Unsorted pages that should not stay as live tabs.",
    tabCount: 0,
    lastSavedLabel: "Not saved yet",
    status: "empty"
  }
];
