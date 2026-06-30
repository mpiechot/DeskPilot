import type { SessionCategory } from "./sessions.js";

export type DeskPilotApi = {
  version: string;
  bridgeStatus: () => Promise<BridgeStatus>;
  extensionInstallInfo: () => Promise<ExtensionInstallInfo>;
  listCategories: () => Promise<SessionCategory[]>;
  createCategory: (input: CategoryInput) => Promise<SessionCategory[]>;
  updateCategory: (id: string, input: CategoryInput) => Promise<SessionCategory[]>;
  deleteCategory: (id: string) => Promise<SessionCategory[]>;
  listDeletedCategories: () => Promise<SessionCategory[]>;
  restoreCategory: (id: string) => Promise<CategoryRecoveryResult>;
  listTabs: (categoryId: string) => Promise<SessionTab[]>;
  addTab: (input: SessionTabInput) => Promise<SessionMutationResult>;
  deleteTab: (id: string) => Promise<SessionMutationResult>;
  listDeletedTabs: (categoryId: string) => Promise<SessionTab[]>;
  restoreTab: (id: string) => Promise<SessionMutationResult>;
  openCategory: (categoryId: string) => Promise<SessionTab[]>;
};

export type CategoryInput = {
  name: string;
  description: string;
};

export type BridgeStatus = {
  running: boolean;
  host: string;
  port: number;
  allowedOrigins: string[];
};

export type ExtensionInstallInfo = {
  extensionPath: string;
  manifestPath: string;
  manifestPresent: boolean;
  supportedBrowsers: string[];
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

export type CategoryRecoveryResult = {
  categories: SessionCategory[];
  deletedCategories: SessionCategory[];
};

export type SessionTabRow = {
  id: string;
  category_id: string;
  url: string;
  title: string;
  saved_at: string;
};
