"use client";

import * as React from "react";

import { UnlistenFn, listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import ok from "assert";

import type { TauriWindowResizeEvent } from "@/types/events";

export type WindowWidthState = {
  windowWidth: number;
  setWindowWidth: React.Dispatch<React.SetStateAction<number>>;
};

const WindowSizeContext = React.createContext<WindowWidthState | null>(null);

export default function WindowSizeProvider({
  children,
}: Readonly<{ children?: React.ReactNode }>): React.ReactNode {
  const [windowWidth, setWindowWidth] = React.useState<number>(0);

  React.useEffect(() => {
    const getInitialWidth = async () => {
      const innerSize = await getCurrentWindow().innerSize();
      setWindowWidth(innerSize.width);
    };

    getInitialWidth();

    const unlisten = listen("tauri://resize", (event: TauriWindowResizeEvent) => {
      setWindowWidth(event.payload.width);
    });

    return () => {
      unlisten.then((off: UnlistenFn) => off());
    };
  }, []);

  const value: WindowWidthState = { windowWidth, setWindowWidth };

  return <WindowSizeContext.Provider value={value}>{children}</WindowSizeContext.Provider>;
}

export function useWidth(): WindowWidthState {
  const context = React.useContext(WindowSizeContext);
  ok(context, Error("Called WindowSizeProvider before window was defined."));
  return context;
}
