"use client";

import * as React from "react";

import * as ReactUse from "@reactuses/core";
import { type Platform, platform as getPlatform } from "@tauri-apps/plugin-os";
import ok from "assert";

import { AppBuildInfo, getAppBuild, invoke } from "@/lib/tauri";
import { call } from "@/lib/utils";
import { Option } from "@/types/option";

export type AppMetaState = {
  buildDate: Option<string>;
  buildInfo: Option<AppBuildInfo>;
  buildTimestamp: Option<string>;
  cargoTargetTriple: Option<string>;
  env: string;
  gitDescribe: Option<string>;
  gitDirty: Option<string>;
  gitSha: Option<string>;
  height: Option<number>;
  nextVersion: Option<string>;
  orientation?: Option<string>;
  platform: Option<string>;
  width: Option<number>;
};

const AppMetaContext = React.createContext<AppMetaState | null>(null);

export default function AppMetaProvider({
  children,
}: Readonly<{ children?: React.ReactNode }>): React.ReactNode {
  const [buildDate, setBuildDate] = React.useState<Option<string>>(null);
  const [buildInfo, setBuildInfo] = React.useState<Option<AppBuildInfo>>(null);
  const [buildTimestamp, setBuildTimestamp] = React.useState<Option<string>>(null);
  const [cargoTargetTriple, setCargoTargetTriple] = React.useState<Option<string>>(null);
  const [env] = React.useState<string>(process.env.NODE_ENV == "development" ? "dev" : "prod");
  const [gitDescribe, setGitDescribe] = React.useState<Option<string>>(null);
  const [gitDirty, setGitDirty] = React.useState<Option<string>>(null);
  const [gitSha, setGitSha] = React.useState<Option<string>>(null);
  const [nextVersion] = React.useState<Option<string>>(process.env.NEXT_VERSION ?? null);
  const [platform, setPlatform] = React.useState<Option<Platform>>(null);

  const { width, height } = ReactUse.useWindowSize();
  const [orientationState] = ReactUse.useOrientation();

  React.useEffect((): void => {
    call(async () => setBuildInfo(await getAppBuild()));
    invoke<string>("vergen_build_date").then(setBuildDate);
    invoke<string>("vergen_build_timestamp").then(setBuildTimestamp);
    invoke<string>("vergen_cargo_target_triple").then(setCargoTargetTriple);
    invoke<string>("vergen_git_describe").then(setGitDescribe);
    invoke<string>("vergen_git_dirty").then(setGitDirty);
    invoke<string>("vergen_git_sha").then(setGitSha);
  }, []);

  // Must happen in useEffect otherwise window might not be defined.
  ReactUse.useOnceEffect(() => setPlatform(getPlatform()));

  const value: AppMetaState = {
    buildDate,
    buildInfo,
    buildTimestamp,
    cargoTargetTriple,
    env,
    gitDescribe,
    gitDirty,
    gitSha,
    height,
    nextVersion,
    orientation: orientationState.type,
    platform,
    width,
  };

  return <AppMetaContext.Provider value={value}>{children}</AppMetaContext.Provider>;
}

export function useAppMetaState(): AppMetaState {
  const context = React.useContext(AppMetaContext);
  ok(context, new Error("AppMeta state was used outside of its Provider"));
  return context;
}
