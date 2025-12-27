"use client";

import * as React from "react";

import { UnlistenFn, listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { platform as getPlatform } from "@tauri-apps/plugin-os";
import type { Platform } from "@tauri-apps/plugin-os";
import ok from "assert";

import type { TauriWindowResizeEvent } from "@/types/events";
import { Option } from "@/types/option";

export type AppMetaState = {
  platform: Option<string>;
  orientation: Option<string>;
  windowWidth: Option<number>;
};

const AppMetaContext = React.createContext<AppMetaState | null>(null);

export default function AppMetaProvider({
  children,
}: Readonly<{ children?: React.ReactNode }>): React.ReactNode {
  const [orientation, setOrientation] = React.useState<Option<string>>(null);
  const [windowWidth, setWindowWidth] = React.useState<Option<number>>(null);
  const [platform, setPlatform] = React.useState<Option<Platform>>(null);

  React.useEffect((): void => setPlatform(getPlatform()), []);

  React.useEffect(() => {
    const getInitialWidth = async () => {
      const innerSize = await getCurrentWindow().innerSize();
      setWindowWidth(innerSize.width);
    };

    getInitialWidth();

    const unlisten: Promise<UnlistenFn> = listen(
      "tauri://resize",
      (event: TauriWindowResizeEvent): void => {
        setWindowWidth(event.payload.width);
      },
    );

    const listener = async (e: MediaQueryListEventMap["change"]): Promise<void> => {
      const innerSize = await getCurrentWindow().innerSize();
      setWindowWidth(innerSize.width);
      setOrientation(e.media);
    };

    const mediaQuery: MediaQueryList = window.matchMedia("(orientation: portrait)");

    mediaQuery.addEventListener("change", listener);

    return () => {
      unlisten.then((off: UnlistenFn) => off());
      mediaQuery.removeEventListener("change", listener);
    };
  }, [platform]);

  const value: AppMetaState = { platform, orientation, windowWidth };

  return <AppMetaContext.Provider value={value}>{children}</AppMetaContext.Provider>;
}

export function useAppMetaState(): AppMetaState {
  const context = React.useContext(AppMetaContext);
  ok(context, new Error("AppMeta state was used outside of its Provider"));
  return context;
}
