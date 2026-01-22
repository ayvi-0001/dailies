import * as RadixContextMenu from "@radix-ui/react-context-menu";
import { ArchiveRestoreIcon } from "lucide-react";

import { invoke } from "@/lib/tauri";
import type { Option } from "@/types/option";

import type { Daily } from "../../types";
import CONTEXT_MENU_CLASSNAME from "./props";

type MenuOptionProps = {
  user_id: number;
  menuTitle?: string;
  daily: Daily;
  setPointsAction: React.Dispatch<React.SetStateAction<Option<string>>>;
  onRefreshAction: () => void;
};

export default function RestoreDailyMenuOption(props: MenuOptionProps) {
  const { user_id, menuTitle, daily, setPointsAction, onRefreshAction } = props;

  return (
    <RadixContextMenu.Item
      className={CONTEXT_MENU_CLASSNAME as string}
      onSelect={async () =>
        await setDailyRestored(user_id, daily, setPointsAction, onRefreshAction)
      }
    >
      <div className="flex flex-row gap-2">
        <ArchiveRestoreIcon size={2} stroke="#e3e3e3" />
        <p className="text-xs text-white">{menuTitle ?? "Restore"}</p>
      </div>
    </RadixContextMenu.Item>
  );
}

async function setDailyRestored(
  user_id: number,
  daily: Daily,
  setPointsAction: React.Dispatch<React.SetStateAction<Option<string>>>,
  onRefreshAction: () => void,
): Promise<void> {
  daily.points = daily.defaultPoints;
  daily.archived = null;
  setPointsAction(`${daily.defaultPoints}`);

  await invoke("handle_point_change", { daily: daily });
  await invoke(`update_archived`, {
    user_id: user_id,
    quest_id: daily.questId,
    point_id: daily.pointId,
    value: daily.archived,
  });

  onRefreshAction();
}
