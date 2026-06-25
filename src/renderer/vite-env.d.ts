/// <reference types="vite/client" />

import type { DeskPilotApi } from "../shared/deskPilotApi";

declare global {
  interface Window {
    deskPilot?: DeskPilotApi;
  }
}

export {};
