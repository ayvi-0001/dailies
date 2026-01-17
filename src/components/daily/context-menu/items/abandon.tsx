import * as RadixContextMenu from "@radix-ui/react-context-menu";
import { BookXIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Option } from "@/types/option";

import type { Daily } from "../../types";

type MenuOptionProps = {
  menuTitle?: string;
  daily: Daily;
  setPointsAction: React.Dispatch<React.SetStateAction<Option<string>>>;
  onRefreshAction: () => void;
};

export default function AbandonDailyMenuOption(props: MenuOptionProps) {
  const { menuTitle, daily, setPointsAction, onRefreshAction } = props;

  return (
    <RadixContextMenu.Item
      className={cn(
        "focus:bg-accent focus:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 dark:data-[variant=destructive]:focus:bg-destructive/20",
        "data-[variant=destructive]:focus:text-destructive data-[variant=destructive]:*:[svg]:!text-destructive [&_svg:not([class*='text-'])]:text-muted-foreground",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        "relative flex cursor-default items-center rounded-sm text-xs outline-hidden select-none",
      )}
      onSelect={async () => await setDailyPointsNull(daily, setPointsAction, onRefreshAction)}
    >
      <div className="flex flex-row gap-2">
        <BookXIcon size={2} stroke="#e3e3e3" />
        <p className="text-xs text-white">{menuTitle ?? "Abandon"}</p>
      </div>
    </RadixContextMenu.Item>
  );
}

async function setDailyPointsNull(
  daily: Daily,
  setPointsAction: React.Dispatch<React.SetStateAction<Option<string>>>,
  onRefreshAction: () => void,
): Promise<void> {
  daily.points = null;
  setPointsAction(null);
  onRefreshAction();
  await (await import("@tauri-apps/api/core")).invoke("handle_point_change", { daily: daily });
}
