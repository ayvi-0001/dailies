import * as React from "react";

import { CalendarDate, DateDuration, today as today_ } from "@internationalized/date";
import { invoke } from "@tauri-apps/api/core";

import type { Daily } from "@/components/daily/types";
import { LOCAL_TZ, formatDateTimeISO8601 } from "@/lib/dates";

export async function queryDailyHistory(
  userName: string,
  questId: string,
  days: number,
): Promise<Daily[]> {
  const startDate: CalendarDate = today_(LOCAL_TZ);
  const duration: DateDuration = { days: days };
  const endDate = startDate.subtract(duration);

  return await invoke<Daily[]>("query_dailies", {
    user: userName,
    quest_id: questId,
    // note: dates reversed
    end_date: formatDateTimeISO8601(startDate.toDate(LOCAL_TZ)).substring(0, 10),
    start_date: formatDateTimeISO8601(endDate.toDate(LOCAL_TZ)).substring(0, 10),
  });
}

export const cachedQueryDailyHistory: (
  userName: string,
  questId: string,
  days: number,
) => Promise<Daily[]> = React.cache(queryDailyHistory);
