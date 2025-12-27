"use client";

import * as React from "react";

import { Window, getCurrentWindow } from "@tauri-apps/api/window";
import Image from "next/image";

import { cn } from "@/lib/utils";

/* eslint-disable @typescript-eslint/no-unused-expressions */

type BackgroundProps = {
  src: string;
  alt?: string;
  props?: React.ComponentProps<"div">;
  imageProps?: React.ComponentProps<typeof Image>;
  children?: React.ReactNode;
};

// TODO(ayvi): parallax background + rotate selection http://ayvi:3000/ayvi/dailies/issues/25
export default function BackgroundImage(background_props: BackgroundProps): React.ReactElement {
  const { src, alt, props, imageProps, children } = background_props;

  const handleWindowDrag = async (event: MouseEvent): Promise<void> => {
    const appWindow: Window = getCurrentWindow();
    if (event.buttons === 1) {
      event.detail === 2 ? appWindow.toggleMaximize() : appWindow.startDragging();
    }
  };

  React.useEffect(() => {
    const backgroundElement: HTMLElement | null = document.getElementById("app-build-info");
    backgroundElement?.addEventListener("mousedown", handleWindowDrag);
    return () => backgroundElement?.removeEventListener("mousedown", handleWindowDrag);
  }, []);

  return (
    <div
      className={cn("fixed inset-0 top-0 left-0 -z-1 h-screen w-screen bg-fixed", props?.className)}
      id="background"
      {...props}
    >
      <Image
        data-tauri-drag-region
        fill
        priority
        alt={alt ?? "background image"}
        className={cn("-z-1 object-cover", imageProps?.className)}
        quality={100}
        src={src}
        {...imageProps}
      />
      {children}
    </div>
  );
}
