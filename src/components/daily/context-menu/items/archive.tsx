import * as RadixContextMenu from "@radix-ui/react-context-menu";
import { CalendarDate, today } from "@internationalized/date";
import { ArchiveIcon } from "lucide-react";

import { LOCAL_TZ, formatDateTimeISO8601 } from "@/lib/dates";
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

export default function ArchiveDailyMenuOption(props: MenuOptionProps) {
  const { user_id, menuTitle, daily, setPointsAction, onRefreshAction } = props;

  return (
    <RadixContextMenu.Item
      className={CONTEXT_MENU_CLASSNAME as string}
      onSelect={async () =>
        await setDailyArchived(user_id, daily, setPointsAction, onRefreshAction)
      }
    >
      <div className="flex flex-row gap-2">
        <ArchiveIcon size={2} stroke="#e3e3e3" />
        <p className="text-xs text-white">{menuTitle ?? "Archive"}</p>
      </div>
    </RadixContextMenu.Item>
  );
}

async function setDailyArchived(
  user_id: number,
  daily: Daily,
  setPointsAction: React.Dispatch<React.SetStateAction<Option<string>>>,
  onRefreshAction: () => void,
): Promise<void> {
  const now: CalendarDate = today(LOCAL_TZ);

  daily.points = null;
  daily.archived = formatDateTimeISO8601(now.toDate(LOCAL_TZ));
  setPointsAction(null);

  await invoke("handle_point_change", { daily: daily });
  await invoke(`update_archived`, {
    user_id: user_id,
    quest_id: daily.questId,
    point_id: daily.pointId,
    value: daily.archived,
  });

  onRefreshAction();
}
