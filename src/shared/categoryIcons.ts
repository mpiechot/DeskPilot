export const categoryIconOptions = [
  { name: "folder", label: "Folder" },
  { name: "briefcase", label: "Briefcase" },
  { name: "book-open", label: "Book" },
  { name: "flask", label: "Research" },
  { name: "clapperboard", label: "Entertainment" },
  { name: "gamepad", label: "Gaming" },
  { name: "code", label: "Code" },
  { name: "inbox", label: "Inbox" },
  { name: "globe", label: "Web" },
  { name: "wrench", label: "Tools" },
  { name: "lightbulb", label: "Ideas" }
] as const;

export type CategoryIconName = (typeof categoryIconOptions)[number]["name"];

export const defaultCategoryIcon: CategoryIconName = "folder";

const categoryIconNames = new Set<string>(categoryIconOptions.map((option) => option.name));

export function normalizeCategoryIcon(value: unknown): CategoryIconName {
  return typeof value === "string" && categoryIconNames.has(value)
    ? (value as CategoryIconName)
    : defaultCategoryIcon;
}
