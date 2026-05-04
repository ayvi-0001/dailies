"use client";

import * as React from "react";
import { useHotkeys } from "react-hotkeys-hook";

import * as ReactUse from "@reactuses/core";

import type { AppBuildInfo } from "@/lib/app-build";
import getAppBuild from "@/lib/app-build";
import { invoke } from "@/lib/tauri";
import { call } from "@/lib/utils";
import { Option } from "@/types/option";

import DevConsole from "./dev-console";

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
    invoke<string>("vergen_cargo_target_triple").then(value => setVergenCargoTargetTriple(value));
    invoke<string>("vergen_build_date").then(value => setVergenBuildDate(value));
    invoke<string>("vergen_git_describe").then(value => setVergenGitDescribe(value));
  }, []);

  const { value: devTerminalOpen, toggle: toggleOpen } = ReactUse.useBoolean(false);

  useHotkeys("F1", () => toggleOpen(), { preventDefault: true }, []);

  const COUNT_TRIGGER_DEV_TERMINAL = 7;
  const TIMEOUT_MS_TRIGGER_DEV_TERMINAL = 1500;
  const [count, set, inc, _, resetCount] = ReactUse.useCounter(0, COUNT_TRIGGER_DEV_TERMINAL, 0);
  const [lastClickTime, setLastClickTime] = React.useState(0);

  React.useEffect(() => {
    if (count === COUNT_TRIGGER_DEV_TERMINAL) {
      resetCount();
      toggleOpen();
      return;
    }
    if (count > 0) {
      const timer = setTimeout(() => {
        resetCount();
      }, TIMEOUT_MS_TRIGGER_DEV_TERMINAL);
      return () => clearTimeout(timer);
    }
  }, [count, resetCount, toggleOpen]);

  const handleClick = () => {
    if (Date.now() - lastClickTime < TIMEOUT_MS_TRIGGER_DEV_TERMINAL) inc();
    else set(1);
    setLastClickTime(Date.now());
  };

  const Info = ({
    textClassValue = "text-[9px]/4 leading-none tracking-tighter text-white/50",
  }: {
    textClassValue?: string;
  }): React.ReactElement => (
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
      {/* <p className={textClassValue}>
        {appBuild?.identifier && appBuild.identifier}
        {appBuild?.version && ` v${appBuild.version}`}
      </p> */}
      <p className={textClassValue}>git:{vergenGitDescribe}</p>
      <p className={textClassValue}>
        {vergenCargoTargetTriple && ` ${vergenCargoTargetTriple}`} {vergenBuildDate}
      </p>
      {appBuild?.bundleType ? <p className={textClassValue}>{appBuild?.bundleType}</p> : null}
    </div>
  );

  switch (as) {
    case "header": {
      return (
        <>
          <React.Suspense>
            <DevConsole open={devTerminalOpen} toggleOpenAction={toggleOpen} />
          </React.Suspense>
          <DragRegion onClick={handleClick} />
          <header
            data-tauri-drag-region
            className="fixed top-2 right-2 z-999 mt-2 mr-2 bg-transparent"
            id="app-build-info"
          >
            <Info />
          </header>
        </>
      );
    }
    case "footer": {
      return (
        <>
          <React.Suspense>
            <DevConsole open={devTerminalOpen} toggleOpenAction={toggleOpen} />
          </React.Suspense>
          <DragRegion onClick={handleClick} />
          <footer
            data-tauri-drag-region
            className="fixed right-2 bottom-2 z-999 m-5 bg-transparent"
            id="app-build-info"
          >
            <Info />
          </footer>
        </>
      );
    }
    default: {
      throw new Error("AppBuildInfo must be set as a header or footer.");
    }
  }
}

const DragRegion = (props: React.ComponentProps<"div">): React.ReactElement => (
  <div
    data-tauri-drag-region
    className="absolute inset-0 top-0 z-1000 h-8 w-screen cursor-move"
    id="data-tauri-drag-region"
    {...props}
  />
);
