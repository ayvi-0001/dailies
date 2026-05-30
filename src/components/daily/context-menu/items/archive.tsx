import * as RadixContextMenu from "@radix-ui/react-context-menu";
import { CalendarDate, today } from "@internationalized/date";
import { ArchiveIcon } from "lucide-react";

import { LOCAL_TZ, formatDateTimeISO8601 } from "@/lib/dates";
import { invoke } from "@/lib/tauri";
import type { Option } from "@/types/option";

import type { Daily } from "../../types";
import CONTEXT_MENU_CLASSNAME from "./props";

type MenuOptionProps = {
  daily: Daily;
  menuTitle?: string;
  setPointsAction: React.Dispatch<React.SetStateAction<Option<string>>>;
  updateDaily: (daily: Daily, patch: Partial<Daily>) => void;
  userId: number;
};

export default function ArchiveDailyMenuOption(props: MenuOptionProps) {
  const { daily, menuTitle, setPointsAction, updateDaily, userId } = props;

  return (
    <RadixContextMenu.Item
      className={CONTEXT_MENU_CLASSNAME as string}
      onSelect={async () => await setDailyArchived(daily, setPointsAction, updateDaily, userId)}
    >
      <div className="flex flex-row gap-2">
        <ArchiveIcon size={2} stroke="#e3e3e3" />
        <p className="text-xs text-white">{menuTitle ?? "Archive"}</p>
      </div>
    </RadixContextMenu.Item>
  );
}

async function setDailyArchived(
  daily: Daily,
  setPointsAction: React.Dispatch<React.SetStateAction<Option<string>>>,
  updateDaily: (daily: Daily, patch: Partial<Daily>) => void,
  userId: number,
): Promise<void> {
  const now: CalendarDate = today(LOCAL_TZ);

  const archivedDate: string = formatDateTimeISO8601(now.toDate(LOCAL_TZ));
  const patch: Partial<Daily> = { points: null, archived: archivedDate };

  await invoke("handle_point_change", { daily: { ...daily, ...patch } });
  await invoke(`update_archived`, {
    user_id: userId,
    quest_id: daily.questId,
    point_id: daily.pointId,
    value: archivedDate,
  });

  setPointsAction(null);
  updateDaily(daily, patch);
}
