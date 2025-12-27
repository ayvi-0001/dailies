"use client";

import * as React from "react";

import type { AppBuildInfo } from "@/lib/app-build";
import getAppBuild from "@/lib/app-build";
import { call } from "@/lib/utils";

type PolymorphicAsProp<E extends React.ElementType> = {
  as?: E;
};

type PolymorphicProps<E extends React.ElementType> = React.PropsWithChildren<
  React.ComponentPropsWithoutRef<E> & PolymorphicAsProp<E>
>;

export const defaultElement = "footer";

export default function AppBuildInfo<E extends React.ElementType = typeof defaultElement>({
  as,
}: PolymorphicProps<E>): React.ReactElement {
  const [appBuild, setAppBuild] = React.useState<AppBuildInfo | null>(null);

  React.useEffect((): void => {
    call(async () => setAppBuild(await getAppBuild()));
  }, []);

  const Info = (): React.ReactElement => (
    <div className="text-right select-none">
      <p className="text-[10px]/4 text-white/50">
        {process.env.NEXT_VERSION && (
          <span className="text-[10px]/4 text-white/50">
            {`Nextjs@${process.env.NEXT_VERSION} | `}
          </span>
        )}
        {appBuild?.tauriVersion && (
          <span className="text-[10px]/4 text-white/50">{`Tauri v${appBuild?.tauriVersion}`}</span>
        )}
      </p>
      <p className="text-[10px]/4 text-white/50">
        {process.env.NODE_ENV == "development" ? "dev" : "prod"}{" "}
        {appBuild?.identifier && appBuild.identifier}
        {appBuild?.version && ` v${appBuild.version}`}
      </p>
      {appBuild?.bundleType ? (
        <p className="text-[10px]/4 text-white/50">{appBuild?.bundleType}</p>
      ) : null}
    </div>
  );

  switch (as) {
    case "header": {
      return (
        <header
          data-tauri-drag-region
          className="fixed top-0 right-2 z-999 mt-2 mr-2 bg-transparent"
          id="app-build-info"
        >
          <Info />
        </header>
      );
    }
    case "footer": {
      return (
        <footer
          data-tauri-drag-region
          className="fixed right-0 bottom-0 z-999 m-5 bg-transparent"
          id="app-build-info"
        >
          <Info />
        </footer>
      );
    }
    default: {
      throw new Error("AppBuildInfo must be set as a header or footer.");
    }
  }
}
