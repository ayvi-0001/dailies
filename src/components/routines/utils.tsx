import React from "react";

import { invoke } from "@tauri-apps/api/core";

import type { Routine } from "@/types/routines";

export async function queryRoutineHistory(
  routineId: string,
  days: number,
): Promise<Routine[]> {
  return await invoke<Routine[]>("query_routine_history", {
    routine_id: routineId,
    days: days,
  });
}

// TODO(ayvi): cached call not working?
export const cachedQueryRoutineHistory: (
  routineId: string,
  days: number,
) => Promise<Routine[]> = React.cache(queryRoutineHistory);
