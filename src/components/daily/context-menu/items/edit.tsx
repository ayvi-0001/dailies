import * as RadixContextMenu from "@radix-ui/react-context-menu";
import { BookTextIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type MenuOptionProps = {
  menuTitle?: string;
  onOpen: () => void;
};

export default function EditMenuOption(props: MenuOptionProps) {
  const { menuTitle, onOpen } = props;

  return (
    <RadixContextMenu.Item
      className={cn(
        "focus:bg-accent focus:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 dark:data-[variant=destructive]:focus:bg-destructive/20",
        "data-[variant=destructive]:focus:text-destructive data-[variant=destructive]:*:[svg]:!text-destructive [&_svg:not([class*='text-'])]:text-muted-foreground",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        "relative flex cursor-default items-center rounded-sm text-xs outline-hidden select-none",
      )}
      onSelect={onOpen}
    >
      <div className="flex flex-row gap-2">
        <BookTextIcon size={2} stroke="#e3e3e3" />
        <p className="text-xs text-white">{menuTitle ?? "Edit"}</p>
      </div>
    </RadixContextMenu.Item>
  );
}
