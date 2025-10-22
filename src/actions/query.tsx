import * as React from "react";

import { invoke } from "@tauri-apps/api/core";

import type { Daily } from "@/components/daily/types";
import { toISO8601 } from "@/lib/dates";

export async function queryDailyHistory(
  userName: string,
  questId: string,
  days: number,
): Promise<Daily[]> {
  const startDate: Date = new Date();
  const endDate: Date = new Date();

  endDate.setDate(endDate.getDate() - 1);
  startDate.setDate(endDate.getDate() - days);

  return await invoke<Daily[]>("query_dailies", {
    user: userName,
    quest_id: questId,
    start_date: toISO8601(startDate),
    end_date: toISO8601(endDate),
  });
}

export const cachedQueryDailyHistory: (
  userName: string,
  questId: string,
  days: number,
) => Promise<Daily[]> = React.cache(queryDailyHistory);
