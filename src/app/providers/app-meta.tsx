"use client";

import * as React from "react";

import * as ReactUse from "@reactuses/core";
import { CalendarDate } from "@heroui/react";
import { ZonedDateTime, parseAbsoluteToLocal, parseDate } from "@internationalized/date";
import { type Platform, platform as getPlatform } from "@tauri-apps/plugin-os";
import { Result, err, ok } from "neverthrow";

import { AppBuildInfo, getAppBuild, invoke } from "@/lib/tauri";
import { call } from "@/lib/utils";
import { Option } from "@/types/option";

export type AppMetaState = {
  buildDate: Option<CalendarDate>;
  buildInfo: Option<AppBuildInfo>;
  buildTimestamp: Option<ZonedDateTime>;
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

const AppMetaContext = React.createContext<Result<AppMetaState, Error>>(
  err(new Error("App Meta Context was used outside of its Provider")),
);

export function useAppMetaState(): AppMetaState {
  return React.useContext(AppMetaContext).match(
    (t) => t,
    (e) => { throw e; },
  );
}

export default function AppMetaProvider({
  children,
}: Readonly<{ children?: React.ReactNode }>): React.ReactNode {
  const [buildDate, setBuildDate] = React.useState<Option<CalendarDate>>(null);
  const [buildInfo, setBuildInfo] = React.useState<Option<AppBuildInfo>>(null);
  const [buildTimestamp, setBuildTimestamp] = React.useState<Option<ZonedDateTime>>(null);
  const [cargoTargetTriple, setCargoTargetTriple] = React.useState<Option<string>>(null);
  const [env] = React.useState<string>(process.env.NODE_ENV == "development" ? "dev" : "prod");
  const [gitDescribe, setGitDescribe] = React.useState<Option<string>>(null);
  const [gitDirty, setGitDirty] = React.useState<Option<string>>(null);
  const [gitSha, setGitSha] = React.useState<Option<string>>(null);
  const [nextVersion] = React.useState<Option<string>>(process.env.NEXT_VERSION ?? null);
  const [platform, setPlatform] = React.useState<Option<Platform>>(null);

  const { width, height } = ReactUse.useWindowSize();
  const [orientationState] = ReactUse.useOrientation();

  React.useEffect(() => void call(async () => setBuildInfo(await getAppBuild())), []);
  React.useEffect(() => void invoke<string>("vergen_git_describe").then(setGitDescribe), []);
  React.useEffect(() => void invoke<string>("vergen_git_dirty").then(setGitDirty), []);
  React.useEffect(() => void invoke<string>("vergen_git_sha").then(setGitSha), []);
  // Must happen in useEffect otherwise window might not be defined.
  React.useEffect(() => void setPlatform(getPlatform()), []);
  React.useEffect(
    () =>
      void invoke<string>("vergen_build_date").then((result) => setBuildDate(parseDate(result))),
    [],
  );
  React.useEffect(
    () =>
      void invoke<string>("vergen_build_timestamp").then((result) =>
        setBuildTimestamp(parseAbsoluteToLocal(result)),
      ),
    [],
  );
  React.useEffect(
    () => void invoke<string>("vergen_cargo_target_triple").then(setCargoTargetTriple),
    [],
  );

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

  return <AppMetaContext.Provider value={ok(value)}>{children}</AppMetaContext.Provider>;
}
