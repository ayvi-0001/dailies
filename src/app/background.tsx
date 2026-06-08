"use client";

import * as React from "react";

import { ZonedDateTime, now } from "@internationalized/date";
import { Event, UnlistenFn, listen } from "@tauri-apps/api/event";
import { Window, getCurrentWindow } from "@tauri-apps/api/window";
import { motion } from "motion/react";
import Image from "next/image";

import { getStoreObject } from "@/actions/store";
import { LOCAL_TZ } from "@/lib/dates";
import { cn } from "@/lib/utils";

import { AppMetaState, useAppMetaState } from "./providers/app-meta";

const getBackgroundSrc = (name: BackgroundSourceName): string => `/images/${name}.png`;

type BackgroundProps = {
  src?: string;
  alt?: string;
  props?: React.ComponentProps<"div">;
  imageProps?: React.ComponentProps<typeof Image>;
  children?: React.ReactNode;
};

export default function BackgroundImage(background_props: BackgroundProps): React.ReactElement {
  const { src, alt, props, imageProps, children } = background_props;

  const appMeta: AppMetaState = useAppMetaState();

  const [srcState, setSrcState] = React.useState<BackgroundSourceName>(() => "black");

  const setBackGroundImageSource = React.useCallback(
    (source: string | null) => {
      if (
        source === null ||
        !Object.values(BackgroundSourceNames).includes(source as BackgroundSourceName) ||
        source === "cycle"
      )
        setSrcState(getTimeOfDay());
      else setSrcState(source as BackgroundSourceName);
    },
    [setSrcState],
  );

  React.useEffect(() => {
    if (src) return;

    const updateBackground = async () => {
      getStoreObject<{ source: string | null }>("settings.json", "background")
        .map((t) => t.source ?? getTimeOfDay())
        .andTee((source) => setBackGroundImageSource(source))
        .mapErr(() => setBackGroundImageSource(getTimeOfDay()));
    };

    // Run update once before timeout.
    updateBackground();

    const currentDateTime = now(LOCAL_TZ);
    const timeoutId = setTimeout(
      () => {
        updateBackground();
        const intervalId = setInterval(updateBackground, 60 * 1000);
        return () => clearInterval(intervalId);
      },
      // Set delay to next hour.
      now(LOCAL_TZ)
        .cycle("hour", 1)
        .cycle("minute", 60 - currentDateTime.minute)
        .cycle("second", 60 - currentDateTime.second)
        .cycle("millisecond", 1000 - currentDateTime.millisecond)
        .compare(currentDateTime),
    );

    return () => clearTimeout(timeoutId);
  }, [src, setBackGroundImageSource]);

  const resolvedSrc: string = src ?? getBackgroundSrc(srcState);

  React.useEffect(() => {
    const unlisten = listen("background-changed", (event: Event<{ source: string }>) =>
      setBackGroundImageSource(event.payload.source as BackgroundSourceName),
    );

    return () => { unlisten.then((off: UnlistenFn) => off()); };
  }, [setBackGroundImageSource]);

  React.useEffect(() => {
    if (appMeta.platform == "windows") {
      const handleWindowDrag = async (event: MouseEvent): Promise<void> => {
        const appWindow: Window = getCurrentWindow();
        if (event.buttons === 1) {
          // // eslint-disable-next-line @typescript-eslint/no-unused-expressions
          // event.detail === 2 ? appWindow.toggleMaximize() : appWindow.startDragging();
          appWindow.startDragging();
        }
      };
      const backgroundElement: HTMLElement | null = document.getElementById("background");
      backgroundElement?.addEventListener("mousedown", handleWindowDrag);
      return () => backgroundElement?.removeEventListener("mousedown", handleWindowDrag);
    }
  }, [appMeta]);

  return (
    <div
      className={cn(
        "fixed inset-0 top-0 left-0 -z-1 h-screen w-screen overflow-hidden bg-fixed",
        props?.className,
      )}
      id="background"
      {...props}
    >
      <motion.div
        animate={{
          x: ["0%", "-50%"],
          y: ["0%", "-3%", "1%", "-2%", "0%"],
        }}
        className="absolute -top-[6%] left-0 flex h-[112%] w-max flex-row will-change-transform"
        transition={{
          x: { duration: 60 * 12, ease: "linear", repeat: Infinity, repeatType: "loop" },
          y: { duration: 60 * 2, ease: "easeInOut", repeat: Infinity, repeatType: "mirror" },
        }}
      >
        {[0, 1].map((i) => (
          <Image
            key={i}
            data-tauri-drag-region
            priority
            alt={alt ?? "background image"}
            className={cn("-z-1 h-full w-auto max-w-none object-cover", imageProps?.className)}
            height={1296}
            quality={100}
            src={resolvedSrc}
            width={2304}
            {...imageProps}
          />
        ))}
      </motion.div>
      {children}
    </div>
  );
}

export const BackgroundSourceNames = {
  Cycle: "cycle",
  Dawn: "dawn",
  Morning: "morning",
  Noon: "noon",
  Afternoon: "afternoon",
  Sunset: "sunset",
  Evening: "evening1",
  Evening2: "evening2",
  Night: "night",
  Thunder: "thunder",
  Black: "black",
} as const;

export type BackgroundSourceName =
  (typeof BackgroundSourceNames)[keyof typeof BackgroundSourceNames];

export function getTimeOfDay(currentTime: ZonedDateTime = now(LOCAL_TZ)): BackgroundSourceName {
  const hour = currentTime.hour;
  if (hour >= 4 && hour < 6) return BackgroundSourceNames.Dawn;
  if (hour >= 6 && hour < 12) return BackgroundSourceNames.Morning;
  if (hour >= 12 && hour < 13) return BackgroundSourceNames.Noon;
  if (hour >= 13 && hour < 17) return BackgroundSourceNames.Afternoon;
  if (hour >= 17 && hour < 19) return BackgroundSourceNames.Sunset;
  if (hour >= 19 && hour < 20) return BackgroundSourceNames.Evening;
  return Math.random() * 100 < 0.5 ? BackgroundSourceNames.Thunder : BackgroundSourceNames.Night;
}
