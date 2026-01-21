import * as React from "react";

import { CalendarDate, DateValue } from "@internationalized/date";
import { invoke } from "@tauri-apps/api/core";

import type { Daily } from "@/components/daily/types";
import { LOCAL_TZ, formatDateTimeISO8601 } from "@/lib/dates";

export async function queryQuestHistory(
  userName: string,
  questId: string,
  startDate: DateValue,
  endDate: DateValue,
): Promise<Daily[]> {
  return await invoke<Daily[]>("query_dailies", {
    user: userName,
    quest_id: questId,
    end_date: formatDateTimeISO8601(endDate.toDate(LOCAL_TZ)).substring(0, 10),
    start_date: formatDateTimeISO8601(startDate.toDate(LOCAL_TZ)).substring(0, 10),
  });
}

export const cachedQueryQuestHistory: (
  userName: string,
  questId: string,
  startDate: CalendarDate,
  endDate: CalendarDate,
) => Promise<Daily[]> = React.cache(queryQuestHistory);
