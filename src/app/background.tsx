"use client";

import * as React from "react";

import { Window, getCurrentWindow } from "@tauri-apps/api/window";
import Image from "next/image";

import { cn } from "@/lib/utils";

/* eslint-disable @typescript-eslint/no-unused-expressions */

type BackgroundProps = {
  src: string;
  alt?: string;
  style?: React.CSSProperties;
  className?: string;
  props?: React.ComponentProps<"div">;
  imageProps?: React.ComponentProps<typeof Image>;
  children?: React.ReactNode;
};

// TODO(ayvi): parallax background + rotate selection
// http://ayvi:3000/ayvi/dailies/issues/25
export default function BackgroundImage(background_props: BackgroundProps): React.ReactElement {
  const { src, alt, style, className, props, imageProps, children } = background_props;

  React.useEffect(() => {
    document.getElementById("background")?.addEventListener("mousedown", (event: MouseEvent) => {
      const appWindow: Window = getCurrentWindow();
      if (event.buttons === 1) {
        event.detail === 2 ? appWindow.toggleMaximize() : appWindow.startDragging();
      }
    });
  }, []);

  return (
    <div
      id="background"
      className={cn("z--2 fixed top-0 left-0 h-screen w-screen", className)}
      {...props}
    >
      <Image
        alt={alt ?? ""}
        fill
        priority
        quality={100}
        src={src}
        style={{ ...style, objectFit: "cover" }}
        {...imageProps}
      />
      {children}
    </div>
  );
}
