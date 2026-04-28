"use client";

import * as React from "react";

import * as ReactUse from "@reactuses/core";
import { platform as getPlatform } from "@tauri-apps/plugin-os";
import type { Platform } from "@tauri-apps/plugin-os";
import ok from "assert";

import { Option } from "@/types/option";

export type AppMetaState = {
  platform: Option<string>;
  orientation?: Option<string>;
  width: Option<number>;
  height: Option<number>;
};

const AppMetaContext = React.createContext<AppMetaState | null>(null);

export default function AppMetaProvider({
  children,
}: Readonly<{ children?: React.ReactNode }>): React.ReactNode {
  const [platform, setPlatform] = React.useState<Option<Platform>>(null);
  const { width, height } = ReactUse.useWindowSize();
  const [orientationState] = ReactUse.useOrientation();

  // Must happen in useEffect otherwise window might not be defined.
  ReactUse.useOnceEffect(() => setPlatform(getPlatform()));

  const value: AppMetaState = {
    platform,
    orientation: orientationState.type,
    width: width,
    height: height,
  };

  return <AppMetaContext.Provider value={value}>{children}</AppMetaContext.Provider>;
}

export function useAppMetaState(): AppMetaState {
  const context = React.useContext(AppMetaContext);
  ok(context, new Error("AppMeta state was used outside of its Provider"));
  return context;
}
