"use client";

import * as React from "react";
import { useHotkeys } from "react-hotkeys-hook";

import * as ReactUse from "@reactuses/core";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { ReadonlyURLSearchParams, useRouter, useSearchParams } from "next/navigation";

import { ModalParam } from "@/app/(app)/@modals/params";
import { AppMetaState, useAppMetaState } from "@/app/providers/app-meta";
import { updateParam } from "@/lib/params";

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
  const appMeta: AppMetaState = useAppMetaState();

  const router: AppRouterInstance = useRouter();
  const searchParams: ReadonlyURLSearchParams = useSearchParams();

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

  const longPressEvent = ReactUse.useLongPress(
    () => {
      updateParam(router, searchParams, [{ key: "modal", value: ModalParam.BuildInfo }]);
    },
    {
      isPreventDefault: false,
      delay: 700,
    },
  );

  const Info = (): React.ReactElement => (
    <span className="text-right text-[9px]/4 leading-none tracking-tighter text-white/50 select-none">
      <p>
        {appMeta.cargoTargetTriple && ` ${appMeta.cargoTargetTriple} `}
        {appMeta.buildDate}
      </p>
      <p>
        {appMeta.gitDescribe}
        {appMeta.gitDescribe &&
          appMeta.gitSha &&
          !/g\w{7}/.test(appMeta.gitDescribe) &&
          `-g${appMeta.gitSha.slice(0, 7)}`}
        {appMeta.gitDirty}
      </p>
      {appMeta.buildInfo?.bundleType && <p>{appMeta.buildInfo?.bundleType}</p>}
    </span>
  );

  switch (as) {
    case "header": {
      return (
        <>
          <React.Suspense>
            <DevConsole open={devTerminalOpen} toggleOpenAction={toggleOpen} />
          </React.Suspense>
          <DragRegion />
          <header
            {...longPressEvent}
            data-tauri-drag-region
            className="fixed top-4 right-6 z-999 bg-transparent"
            id="app-build-info"
            onClick={handleClick}
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
            {...longPressEvent}
            data-tauri-drag-region
            className="fixed right-6 bottom-4 z-999 bg-transparent"
            id="app-build-info"
            onClick={handleClick}
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
    className="absolute inset-0 top-0 z-1000 h-4 w-screen cursor-move"
    id="data-tauri-drag-region"
    {...props}
  />
);
