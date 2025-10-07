"use client";

import React from "react";
import { useEffect } from "react";

import { Event, listen } from "@tauri-apps/api/event";
import dynamic from "next/dynamic";
import { toast } from "sonner";

import type { ErrorMessage } from "@/types/errors";

export default function Toaster(): React.ReactElement {
  useEffect(() => {
    const err: string = "tauri://error";
    listen<ErrorMessage>(err, (event: Event<ErrorMessage>) => {
      toast.error(err, { description: event.payload.message });
    });
  }, []);

  const Toaster = dynamic(() => import("sonner").then(mod => mod.Toaster), {
    ssr: false,
  });

  return (
    <Toaster
      closeButton
      duration={10000}
      expand={true}
      gap={4}
      position="bottom-right"
      richColors
      theme="dark"
      toastOptions={{ classNames: { title: "text-md font-bold" } }}
    />
  );
}
