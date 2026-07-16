import { defaultCategoryIcon, type CategoryIconName } from "./categoryIcons.js";

export type SessionCategory = {
  id: string;
  name: string;
  description: string;
  icon: CategoryIconName;
  tabCount: number;
  lastSavedLabel: string;
  status: "ready" | "empty" | "needs-review";
};

export const defaultCategories: SessionCategory[] = [
  {
    id: "work",
    name: "Work",
    description: "Active tasks, dashboards and operational pages.",
    icon: defaultCategoryIcon,
    tabCount: 0,
    lastSavedLabel: "Not saved yet",
    status: "empty"
  },
  {
    id: "research",
    name: "Research",
    description: "Investigations, docs and notes worth restoring later.",
    icon: defaultCategoryIcon,
    tabCount: 0,
    lastSavedLabel: "Not saved yet",
    status: "empty"
  },
  {
    id: "entertainment",
    name: "Entertainment",
    description: "Media, streams and relaxing browser contexts.",
    icon: defaultCategoryIcon,
    tabCount: 0,
    lastSavedLabel: "Not saved yet",
    status: "empty"
  },
  {
    id: "projects",
    name: "Projects",
    description: "Project-specific browser contexts.",
    icon: defaultCategoryIcon,
    tabCount: 0,
    lastSavedLabel: "Not saved yet",
    status: "empty"
  },
  {
    id: "inbox",
    name: "Later / Inbox",
    description: "Unsorted pages that should not stay as live tabs.",
    icon: defaultCategoryIcon,
    tabCount: 0,
    lastSavedLabel: "Not saved yet",
    status: "empty"
  }
];
