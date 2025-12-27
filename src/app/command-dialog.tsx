"use client";

import * as React from "react";
import { useHotkeys } from "react-hotkeys-hook";

import { OnBackButtonPressPayload, onBackButtonPress } from "@tauri-apps/api/app";
import { platform } from "@tauri-apps/plugin-os";
import type { Platform } from "@tauri-apps/plugin-os";
import { relaunch } from "@tauri-apps/plugin-process";
import { useRouter } from "next/navigation";

import * as Command from "@/components/ui/command";
import { truncate_sessions } from "@/actions/logout";

// NOTE: This component is just to access helper functions during development.
// It's only mounted when process.env.NODE_ENV === "development".
export default function CommandDialog(): React.ReactElement {
  const [open, setOpen] = React.useState<boolean>(false);
  const [currentPlatform, setCurrentPlatform] = React.useState<Platform | null>(null);
  const router = useRouter();

  useHotkeys("Slash", () => setOpen(open => !open), { preventDefault: true }, []);

  React.useEffect((): void => setCurrentPlatform(platform()), []);

  if (currentPlatform == "android") {
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
    {
      name: "export-db",
      callback: async () => (await import("@tauri-apps/api/core")).invoke("export_db", {}),
    },
    {
      name: "import-db",
      callback: async () => (await import("@tauri-apps/api/core")).invoke("import_db", {}),
    },
  ];

  const commandItems: React.ReactElement[] = commandOptions.map((options, idx: number) => {
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
