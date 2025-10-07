import type { EventName } from "@tauri-apps/api/event";

type TauriWindowResizeEvent = {
  event: EventName;
  payload: { width: number; height: number };
  id: number;
};

export type { TauriWindowResizeEvent };
