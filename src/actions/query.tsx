import * as React from "react";

import { invoke } from "@tauri-apps/api/core";

import type { Daily } from "@/components/daily/types";

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
    start_date: startDate.toISOString().substring(0, 10),
    end_date: endDate.toISOString().substring(0, 10),
  });
}

export const cachedQueryDailyHistory: (
  userName: string,
  questId: string,
  days: number,
) => Promise<Daily[]> = React.cache(queryDailyHistory);
