"use client";

import * as React from "react";

import { ClassValue } from "clsx";

import type { AppBuildInfo } from "@/lib/app-build";
import getAppBuild from "@/lib/app-build";
import { invoke } from "@/lib/tauri";
import { call } from "@/lib/utils";
import { Option } from "@/types/option";

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
  const [appBuild, setAppBuild] = React.useState<Option<AppBuildInfo>>(null);
  const [vergenGitDescribe, setVergenGitDescribe] = React.useState<string>("");
  const [vergenBuildDate, setVergenBuildDate] = React.useState<string>("");
  const [vergenCargoTargetTriple, setVergenCargoTargetTriple] = React.useState<string>("");

  React.useEffect((): void => {
    call(async () => setAppBuild(await getAppBuild()));
  }, []);

  React.useEffect((): void => {
    invoke<string>("vergen_git_describe").then(value => setVergenGitDescribe(value));
  }, []);

  React.useEffect((): void => {
    invoke<string>("vergen_cargo_target_triple").then(value => setVergenCargoTargetTriple(value));
  }, []);

  React.useEffect((): void => {
    invoke<string>("vergen_build_date").then(value => setVergenBuildDate(value));
  }, []);

  const textClassValue: ClassValue = "text-[10px]/4 leading-none tracking-tighter text-white/50";

  const Info = (): React.ReactElement => (
    // TODO(ayvi): show dep versions on 'about' page http://ayvi:3000/ayvi/dailies/issues/185
    // {
    //   <p className={textClassValue}>
    //     {process.env.NEXT_VERSION && (
    //       <span className={textClassValue}>{`Nextjs@${process.env.NEXT_VERSION} | `}</span>
    //     )}
    //     {appBuild?.tauriVersion && (
    //       <span className={textClassValue}>{`Tauri v${appBuild?.tauriVersion}`}</span>
    //     )}
    //   </p>
    // }
    // <p className={textClassValue}>
    //   {process.env.NODE_ENV == "development" ? "dev" : "prod"}{" "}
    // </p>

    <div className="cursor-move pr-2 text-right select-none">
      <p className={textClassValue}>
        {appBuild?.identifier && appBuild.identifier}
        {appBuild?.version && ` v${appBuild.version}`}
      </p>
      <p className={textClassValue}>
        {vergenCargoTargetTriple && ` ${vergenCargoTargetTriple}`} {vergenBuildDate}
      </p>
      <p className={textClassValue}>git:{vergenGitDescribe}</p>
      {appBuild?.bundleType ? <p className={textClassValue}>{appBuild?.bundleType}</p> : null}
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
