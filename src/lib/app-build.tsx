import {
  BundleType,
  getBundleType,
  getIdentifier,
  getName,
  getTauriVersion,
  getVersion,
} from "@tauri-apps/api/app";

export default async function getAppBuild(): Promise<AppBuildInfo> {
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
