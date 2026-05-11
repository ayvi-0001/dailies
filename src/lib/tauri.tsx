import { BundleType } from "@tauri-apps/api/app";
import { getBundleType, getIdentifier, getName } from "@tauri-apps/api/app";
import { getTauriVersion, getVersion } from "@tauri-apps/api/app";
import type { InvokeArgs } from "@tauri-apps/api/core";

const isNode = (): boolean =>
  Object.prototype.toString.call(typeof process !== "undefined" ? process : 0) ===
  "[object process]";

export async function invoke<T>(cmd: string, args?: InvokeArgs | undefined): Promise<T> {
  if (isNode()) {
    // This shouldn't ever happen when React fully loads
    return Promise.resolve(undefined as unknown as T);
  }
  const tauriAppsApi = await import("@tauri-apps/api/core");
  const tauriInvoke = tauriAppsApi.invoke;
  return tauriInvoke(cmd, args);
}

export async function getAppBuild(): Promise<AppBuildInfo> {
  const bundleType: BundleType = await getBundleType();
  const identifier: string = await getIdentifier();
  const name: string = await getName();
  const tauriVersion: string = await getTauriVersion();
  const version: string = await getVersion();

  return {
    bundleType: bundleType,
    identifier: identifier,
    name: name,
    tauriVersion: tauriVersion,
    version: version,
  } satisfies AppBuildInfo;
}

export type AppBuildInfo = {
  bundleType: BundleType;
  identifier: string;
  name: string;
  tauriVersion: string;
  version: string;
};
