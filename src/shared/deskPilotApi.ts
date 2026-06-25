import type { SessionCategory } from "./sessions.js";

export type DeskPilotApi = {
  version: string;
  listCategories: () => Promise<SessionCategory[]>;
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
