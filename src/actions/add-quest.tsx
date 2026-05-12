import { today } from "@internationalized/date";
import { invoke } from "@tauri-apps/api/core";
import { z } from "zod";

import { Quest } from "@/components/daily";
import { LOCAL_TZ } from "@/lib/dates";
import { FormState } from "@/lib/forms";
import type { AppError } from "@/types/errors";
import { Option } from "@/types/option";

export default async function addQuest(_state: FormState, formData: FormData): Promise<FormState> {
  const now: Date = today(LOCAL_TZ).toDate(LOCAL_TZ);

  const validatedFields = Quest.NewQuestFormSchema.safeParse({
    userId: formData.get("userId"),
    chain: formData.get("chain"),
    name: formData.get("name"),
    sequence: 0, // sequence will be set to last in quest chain
    typeId: formData.get("typeId"),
    defaultPoints: formData.get("defaultPoints"),
    total: formData.get("total"),
    weight: formData.get("weight"),
    streakTarget: formData.get("streakTarget"),
    requirements: formData.get("requirements"),
    timeStart: formData.get("timeStart"),
    timeEnd: formData.get("timeEnd"),
    accepted: now,
    days: formData.getAll("days"),
    description: formData.get("description"),
  });

  if (!validatedFields.success) {
    const errTree = z.treeifyError(validatedFields.error);
    return {
      errors: {
        chain: errTree.properties?.chain?.errors ?? null,
        name: errTree.properties?.name?.errors ?? null,
        typeId: errTree.properties?.typeId?.errors ?? null,
        defaultPoints: errTree.properties?.defaultPoints?.errors ?? null,
        total: errTree.properties?.total?.errors ?? null,
        weight: errTree.properties?.weight?.errors ?? null,
        streakTarget: errTree.properties?.streakTarget?.errors ?? null,
        requirements: errTree.properties?.requirements?.errors ?? null,
        timeStart: errTree.properties?.timeStart?.errors ?? null,
        timeEnd: errTree.properties?.timeEnd?.errors ?? null,
        days: errTree.properties?.days?.errors ?? null,
        description: errTree.properties?.description?.errors ?? null,
      },
    };
  }

  await invoke<Option<AppError>>("insert_quest", {
    quest: validatedFields.data,
  }).catch(console.error);

  return {} satisfies FormState;
}
