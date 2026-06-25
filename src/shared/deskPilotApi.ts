import type { SessionCategory } from "./sessions.js";

export type DeskPilotApi = {
  version: string;
  listCategories: () => Promise<SessionCategory[]>;
  createCategory: (input: CategoryInput) => Promise<SessionCategory[]>;
  updateCategory: (id: string, input: CategoryInput) => Promise<SessionCategory[]>;
  deleteCategory: (id: string) => Promise<SessionCategory[]>;
};

export type CategoryInput = {
  name: string;
  description: string;
};

export type CategoryRow = {
  id: string;
  name: string;
  description: string;
  position: number;
  is_favorite: number;
  tab_count: number;
  last_saved_at: string | null;
};
