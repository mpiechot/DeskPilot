import { defaultCategoryIcon, type CategoryIconName } from "./categoryIcons.js";

export type SessionCategory = {
  id: string;
  name: string;
  description: string;
  icon: CategoryIconName;
  tabCount: number;
};

export const defaultCategories: SessionCategory[] = [
  {
    id: "work",
    name: "Work",
    description: "Active tasks, dashboards and operational pages.",
    icon: defaultCategoryIcon,
    tabCount: 0
  },
  {
    id: "research",
    name: "Research",
    description: "Investigations, docs and notes worth restoring later.",
    icon: defaultCategoryIcon,
    tabCount: 0
  },
  {
    id: "entertainment",
    name: "Entertainment",
    description: "Media, streams and relaxing browser contexts.",
    icon: defaultCategoryIcon,
    tabCount: 0
  },
  {
    id: "projects",
    name: "Projects",
    description: "Project-specific browser contexts.",
    icon: defaultCategoryIcon,
    tabCount: 0
  },
  {
    id: "inbox",
    name: "Later / Inbox",
    description: "Unsorted pages that should not stay as live tabs.",
    icon: defaultCategoryIcon,
    tabCount: 0
  }
];
