import React from "react";

import { invoke } from "@tauri-apps/api/core";

import type { Routine } from "@/types/routines";

export async function queryRoutineHistory(
  routineId: string,
  days: number,
): Promise<Routine[]> {
  let startDate: Date = new Date();
  // TODO(ayvi): replace fixed date with current date after dev
  let endDate: Date = new Date("2025-10-03");

  startDate.setDate(endDate.getDate() - days);

  return await invoke<Routine[]>("query_routine_history", {
    routine_id: routineId,
    start_date: startDate.toISOString().substring(0, 10),
    end_date: endDate.toISOString().substring(0, 10),
  });
}

// TODO(ayvi): cached call not working?
export const cachedQueryRoutineHistory: (
  routineId: string,
  days: number,
) => Promise<Routine[]> = React.cache(queryRoutineHistory);
