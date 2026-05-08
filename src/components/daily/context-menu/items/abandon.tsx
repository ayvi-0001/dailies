import * as RadixContextMenu from "@radix-ui/react-context-menu";
import { BookXIcon } from "lucide-react";

import { invoke } from "@/lib/tauri";
import type { Option } from "@/types/option";

import type { Daily } from "../../types";
import CONTEXT_MENU_CLASSNAME from "./props";

type MenuOptionProps = {
  menuTitle?: string;
  daily: Daily;
  setPointsAction: React.Dispatch<React.SetStateAction<Option<string>>>;
  updateDaily: (daily: Daily, patch: Partial<Daily>) => void;
};

export default function AbandonDailyMenuOption(props: MenuOptionProps) {
  const { menuTitle, daily, setPointsAction, updateDaily } = props;

  return (
    <RadixContextMenu.Item
      className={CONTEXT_MENU_CLASSNAME as string}
      onSelect={async () => await setDailyPointsNull(daily, setPointsAction, updateDaily)}
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
  updateDaily: (daily: Daily, patch: Partial<Daily>) => void,
): Promise<void> {
  const patch: Partial<Daily> = { points: null };
  await invoke("handle_point_change", { daily: { ...daily, ...patch } });
  setPointsAction(null);
  updateDaily(daily, patch);
}
