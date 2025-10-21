"use client";

import * as React from "react";
import { useHotkeys } from "react-hotkeys-hook";

import { useRouter } from "next/navigation";

import * as Command from "@/components/ui/command";
import { truncate_sessions } from "@/actions/logout";

export default function CommandDialog() {
  const [open, setOpen] = React.useState<boolean>(false);
  const router = useRouter();

  useHotkeys("Slash", () => setOpen(open => !open), { preventDefault: true }, []);

  // NOTE: These are just helper functions for development and aren't meant to be included
  // in the final app.
  const commandOptions = [
    {
      name: "goto home",
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
      name: "insert dailies",
      callback: async () => (await import("@tauri-apps/api/core")).invoke("insert_dailies", {}),
    },
  ];

  const commandItems: React.ReactElement[] = commandOptions.map((options, idx: number) => {
    const callback = () => {
      setOpen(open => !open);
      options.callback();
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
