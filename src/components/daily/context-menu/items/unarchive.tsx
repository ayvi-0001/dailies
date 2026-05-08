import * as RadixContextMenu from "@radix-ui/react-context-menu";
import { ArchiveRestoreIcon } from "lucide-react";

import { invoke } from "@/lib/tauri";
import type { Option } from "@/types/option";

import type { Daily } from "../../types";
import CONTEXT_MENU_CLASSNAME from "./props";

type MenuOptionProps = {
  daily: Daily;
  menuTitle?: string;
  setPointsAction: React.Dispatch<React.SetStateAction<Option<string>>>;
  updateDaily: (daily: Daily, patch: Partial<Daily>) => void;
  user_id: number;
};

export default function RestoreDailyMenuOption(props: MenuOptionProps) {
  const { daily, menuTitle, setPointsAction, updateDaily, user_id } = props;

  return (
    <RadixContextMenu.Item
      className={CONTEXT_MENU_CLASSNAME as string}
      onSelect={async () => await setDailyRestored(daily, setPointsAction, updateDaily, user_id)}
    >
      <div className="flex flex-row gap-2">
        <ArchiveRestoreIcon size={2} stroke="#e3e3e3" />
        <p className="text-xs text-white">{menuTitle ?? "Restore"}</p>
      </div>
    </RadixContextMenu.Item>
  );
}

async function setDailyRestored(
  daily: Daily,
  setPointsAction: React.Dispatch<React.SetStateAction<Option<string>>>,
  updateDaily: (daily: Daily, patch: Partial<Daily>) => void,
  user_id: number,
): Promise<void> {
  const patch: Partial<Daily> = { points: daily.defaultPoints, archived: null };

  await invoke("handle_point_change", { daily: { ...daily, ...patch } });
  await invoke(`update_archived`, {
    user_id: user_id,
    quest_id: daily.questId,
    point_id: daily.pointId,
    value: null,
  });

  setPointsAction(`${daily.defaultPoints}`);
  updateDaily(daily, patch);
}
