import * as React from "react";

import { invoke } from "@tauri-apps/api/core";

import type { Daily } from "../types";

export async function queryDailyHistory(
  userName: string,
  questId: string,
  days: number,
): Promise<Daily[]> {
  const startDate: Date = new Date();
  // TODO(ayvi): replace fixed date with current date after dev
  const endDate: Date = new Date("2025-10-02");

  startDate.setDate(endDate.getDate() - days);

  return await invoke<Daily[]>("query_dailies", {
    user: userName,
    quest_id: questId,
    start_date: startDate.toISOString().substring(0, 10),
    end_date: endDate.toISOString().substring(0, 10),
  });
}

// TODO(ayvi): cached call not working?
export const cachedQueryDailyHistory: (
  userName: string,
  questId: string,
  days: number,
) => Promise<Daily[]> = React.cache(queryDailyHistory);
