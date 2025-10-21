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
    <footer>
      <div className="fixed right-0 bottom-0 m-5 bg-transparent">
        <div className="text-right">
          <p className="text-[11px]/4 text-white/50">
            {appBuild?.name && `${appBuild.name} v${appBuild.version}`}
          </p>
          <p className="text-[11px]/4 text-white/50">
            {appBuild?.identifier && appBuild.identifier}
          </p>
          <p className="text-[11px]/4 text-white/50">
            {process.env.NEXT_VERSION && (
              <span className="text-[11px]/4 text-white/50">
                {`Nextjs@${process.env.NEXT_VERSION} | `}
              </span>
            )}
            {appBuild?.tauriVersion && (
              <span className="text-[11px]/4 text-white/50">
                {`Tauri v${appBuild?.tauriVersion}`}
              </span>
            )}
          </p>
          {appBuild?.bundleType ? (
            <p className="text-[11px]/4 text-white/50">{appBuild?.bundleType}</p>
          ) : null}
        </div>
      </div>
    </footer>
  );
}
