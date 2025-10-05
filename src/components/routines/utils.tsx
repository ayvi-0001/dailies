import { invoke } from "@tauri-apps/api/core";

import type { Routine } from "@/types/routines";

export default async function queryRoutineHistory(
  routineId: string,
  days: number,
): Promise<Routine[]> {
  return await invoke<Routine[]>("query_routine_history", {
    routine_id: routineId,
    days: days,
  });
}
