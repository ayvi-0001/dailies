"use client";

import * as React from "react";

import { Event, UnlistenFn, listen } from "@tauri-apps/api/event";
import dynamic from "next/dynamic";
import { toast } from "sonner";

import type { ErrorMessage } from "@/types/errors";

export default function Toaster(): React.ReactElement {
  React.useEffect(() => {
    const unlistenInfo = listen<ErrorMessage>("tauri://info", (event: Event<ErrorMessage>) => { toast.info("tauri://info", { description: event.payload.message }); });
    const unlistenError = listen<ErrorMessage>("tauri://error", (event: Event<ErrorMessage>) => { toast.error("tauri://error", { description: event.payload.message }); });

    return () => {
      unlistenInfo.then((off: UnlistenFn) => off());
      unlistenError.then((off: UnlistenFn) => off());
    };
  }, []);

  const Toaster = dynamic(() => import("sonner").then((mod) => mod.Toaster), {
    ssr: false,
  });

  return (
    <Toaster
      closeButton
      richColors
      className="z-999"
      duration={10000}
      expand={true}
      gap={4}
      position="bottom-right"
      theme="dark"
      toastOptions={{ classNames: { title: "text-md font-bold" } }}
      visibleToasts={5}
    />
  );
}
