"use client";

import * as React from "react";
import { useHotkeys } from "react-hotkeys-hook";

import { OnBackButtonPressPayload, onBackButtonPress } from "@tauri-apps/api/app";
import { relaunch } from "@tauri-apps/plugin-process";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { useRouter } from "next/navigation";

import * as Command from "@/components/ui/command";
import { truncate_sessions } from "@/actions/logout";

import { AppMetaState, useAppMetaState } from "./providers/app-meta";

// NOTE: This component is just to access helper functions during development.
// It's only mounted when process.env.NODE_ENV === "development".
export default function CommandDialog(): React.ReactElement {
  const [open, setOpen] = React.useState<boolean>(false);
  const router: AppRouterInstance = useRouter();

  const appMeta: AppMetaState = useAppMetaState();

  useHotkeys("Slash", () => setOpen(open => !open), { preventDefault: true }, []);

  if (appMeta.platform == "android") {
    onBackButtonPress((_: OnBackButtonPressPayload): void => {
      setOpen(open => !open);
    });
  }

  const commandOptions = [
    {
      name: "relaunch",
      callback: async () => await relaunch(),
    },
    {
      name: "goto root",
      callback: async () => router.push("/"),
    },
    {
      name: "goto login",
      callback: async () => router.push("/login"),
    },
    {
      name: "goto signup",
      callback: async () => router.push("/signup"),
    },
    {
      name: "logout",
      callback: async () => {
        await truncate_sessions();
        router.push("/login");
      },
    },
    appMeta.platform == "android"
      ? {
          name: "export-db",
          callback: async () => (await import("@tauri-apps/api/core")).invoke("export_db", {}),
        }
      : null,
    appMeta.platform == "android"
      ? {
          name: "import-db",
          callback: async () => (await import("@tauri-apps/api/core")).invoke("import_db", {}),
        }
      : null,
  ];

  const commandItems: React.ReactElement[] = commandOptions
    .filter(cmd => !!cmd)
    .map((options, idx: number) => {
      const callback = () => {
        options.callback();
        setOpen(open => !open);
      };
      return (
        <Command.CommandItem key={`command_${idx}`} onSelect={callback}>
          <span>{options.name}</span>
        </Command.CommandItem>
      );
    });

  return (
    <div className="dark">
      <Command.CommandDialog className="dark" open={open} onOpenChange={setOpen}>
        <Command.CommandInput />
        <Command.CommandList>
          <Command.CommandEmpty>No results found.</Command.CommandEmpty>
          <Command.CommandGroup heading="commands">
            {commandItems.map((element, idx) => (
              <div key={idx}>{element}</div>
            ))}
          </Command.CommandGroup>
        </Command.CommandList>
      </Command.CommandDialog>
    </div>
  );
}
