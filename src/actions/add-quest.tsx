import { getLocalTimeZone, today } from "@internationalized/date";
import { invoke } from "@tauri-apps/api/core";
import { RedirectType, redirect } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";

import { Quest } from "@/components/daily";
import type { AppError } from "@/types/errors";

export type AddQuestErrors = {
  errors?: {
    chain?: string[];
    name?: string[];
    typeId?: string[];
    defaultPoints?: string[];
    total?: string[];
    weight?: string[];
    streakTarget?: string[];
    requirements?: string[];
    timeStart?: string[];
    timeEnd?: string[];
    accepted?: string[];
    archived?: string[];
    days?: string[];
    description?: string[];
    streak?: string[];
    other?: string[];
  };
};

export type AddQuestState = AddQuestErrors | undefined;

export default async function addQuest(
  _: AddQuestState,
  formData: FormData,
): Promise<AddQuestErrors> {
  const tz: string = getLocalTimeZone();
  const now: Date = today(tz).toDate(tz);

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
        chain: errTree.properties?.chain?.errors,
        name: errTree.properties?.name?.errors,
        typeId: errTree.properties?.typeId?.errors,
        defaultPoints: errTree.properties?.defaultPoints?.errors,
        total: errTree.properties?.total?.errors,
        weight: errTree.properties?.weight?.errors,
        streakTarget: errTree.properties?.streakTarget?.errors,
        requirements: errTree.properties?.requirements?.errors,
        timeStart: errTree.properties?.timeStart?.errors,
        timeEnd: errTree.properties?.timeEnd?.errors,
        days: errTree.properties?.days?.errors,
        description: errTree.properties?.description?.errors,
      },
    };
  }

  await invoke<AppError | null>("insert_quest", {
    quest: validatedFields.data,
  }).catch((err: AppError) => {
    toast.error(`${JSON.stringify(err)}`);
  });

  window.location.reload();

  redirect("/", RedirectType.replace);
}
