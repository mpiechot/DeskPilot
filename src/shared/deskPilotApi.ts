import type { SessionCategory } from "./sessions.js";

export type DeskPilotApi = {
  version: string;
  listCategories: () => Promise<SessionCategory[]>;
  createCategory: (input: CategoryInput) => Promise<SessionCategory[]>;
  updateCategory: (id: string, input: CategoryInput) => Promise<SessionCategory[]>;
  deleteCategory: (id: string) => Promise<SessionCategory[]>;
  listTabs: (categoryId: string) => Promise<SessionTab[]>;
  addTab: (input: SessionTabInput) => Promise<SessionMutationResult>;
  deleteTab: (id: string) => Promise<SessionMutationResult>;
  openCategory: (categoryId: string) => Promise<SessionTab[]>;
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

export type SessionTab = {
  id: string;
  categoryId: string;
  url: string;
  title: string;
  savedAt: string;
};

export type SessionTabInput = {
  categoryId: string;
  url: string;
  title: string;
};

export type SessionMutationResult = {
  categories: SessionCategory[];
  tabs: SessionTab[];
};

export type SessionTabRow = {
  id: string;
  category_id: string;
  url: string;
  title: string;
  saved_at: string;
};
