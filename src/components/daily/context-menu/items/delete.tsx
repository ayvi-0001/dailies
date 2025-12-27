import * as RadixContextMenu from "@radix-ui/react-context-menu";
import { SkullIcon } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

type MenuOptionProps = {
  menuTitle?: string;
  pointId: string;
};

export default function DeleteMenuOption(props: MenuOptionProps) {
  const { menuTitle, pointId } = props;

  return (
    <RadixContextMenu.Item
      className={cn(
        "focus:bg-accent focus:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 dark:data-[variant=destructive]:focus:bg-destructive/20",
        "data-[variant=destructive]:focus:text-destructive data-[variant=destructive]:*:[svg]:!text-destructive [&_svg:not([class*='text-'])]:text-muted-foreground",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        "relative flex cursor-default items-center rounded-sm text-xs outline-hidden select-none",
      )}
      onSelect={async () => {
        toast.promise(
          async () => {
            (await import("@tauri-apps/api/core")).invoke("delete_daily", {
              point_id: pointId,
            });
          },
          {
            loading: "Deleting record...",
            success: () => {
              return `Deleted`;
            },
            error: "Error",
          },
        );
        // TODO(ayvi): remove card without reloading page http://ayvi:3000/ayvi/dailies/issues/110
        window.location.reload();
      }}
    >
      <div className="flex flex-row gap-2">
        <SkullIcon height="16px" stroke="#e3e3e3" width="16px" />
        <p className="text-xs text-red-400">{menuTitle ?? "Delete"}</p>
      </div>
    </RadixContextMenu.Item>
  );
}
