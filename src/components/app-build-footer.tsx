"use client";

import * as React from "react";

import type { AppBuildInfo } from "@/lib/app-build";
import getAppBuild from "@/lib/app-build";

export default function AppBuildFooter(): React.ReactElement {
  const [appBuild, setAppBuild] = React.useState<AppBuildInfo | null>(null);

  React.useEffect((): void => {
    const callGetAppBuild = async () => setAppBuild(await getAppBuild());
    callGetAppBuild();
  }, []);

  return (
    <div className="fixed right-0 bottom-0 m-5 bg-transparent">
      <div className="text-right">
        <p className="text-[11px]/4 text-white/50">
          {appBuild?.name} v{appBuild?.version}
        </p>
        {appBuild?.tauriVersion ? (
          <p className="text-[11px]/4 text-white/50">Tauri v{appBuild?.tauriVersion}</p>
        ) : null}
        <p className="text-[11px]/4 text-white/50">{appBuild?.identifier}</p>
        {appBuild?.bundleType ? (
          <p className="text-[11px]/4 text-white/50">{appBuild?.bundleType}</p>
        ) : null}
      </div>
    </div>
  );
}
