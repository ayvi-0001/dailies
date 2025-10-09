"use client";

import * as React from "react";

import * as Command from "@/components/ui/command";

export default function CommandDialog() {
  const [open, setOpen] = React.useState<boolean>(false);

  React.useEffect(() => {
    const down = (event: KeyboardEvent): void => {
      if (event.key === "/") {
        event.preventDefault();
        setOpen(open => !open);
      }
    };

    document.addEventListener("keydown", down);

    return (): void => document.removeEventListener("keydown", down);
  }, []);

  let commandItems: React.ReactElement[] = [
    <Command.CommandItem
      onSelect={async () => {
        console.log(`called add daily`);
        setOpen(open => !open);
      }}
    >
      <span>add daily</span>
    </Command.CommandItem>,
    <Command.CommandItem
      onSelect={async () => {
        console.log(`called delete daily`);
        setOpen(open => !open);
      }}
    >
      <span>delete daily</span>
    </Command.CommandItem>,
  ];

  return (
    <div className="dark bg-black">
      <p className="text-muted-foreground bg-black text-sm">
        Press{" "}
        <kbd className="bg-muted text-muted-foreground pointer-events-none inline-flex h-5 items-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium opacity-100 select-none">
          <span className="text-xs">Γîÿ</span>J
        </kbd>
      </p>
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
