import * as log from "@tauri-apps/plugin-log";
import { toast } from "sonner";
import { z } from "zod";

import * as utils from "@/lib/utils";
import { Daily, Quest } from "@/components/daily";
import { QuestType } from "@/components/daily/providers/quest-types";
import { formatDateTimeISO8601 } from "@/lib/dates";

export type EditQuestErrors = {
  errors?: {
    archived?: string[];
    chain?: string[];
    days?: string[];
    name?: string[];
    description?: string[];
    note?: string[];
    requirements?: string[];
    streakTarget?: string[];
    timeStart?: string[];
    timeEnd?: string[];
    defaultPoints?: string[];
    total?: string[];
    typeId?: string[];
    weight?: string[];
    other?: string[];
  };
};

export type EditQuestState = EditQuestErrors | undefined;

export default async function editQuest(
  _: EditQuestState,
  formData: FormData,
  originalValues: Daily,
  questTypes: QuestType[],
  historic?: boolean,
): Promise<EditQuestErrors | Partial<Daily>> {
  const validatedFields = Quest.EditQuestFormSchema.safeParse({
    archived: historic ? originalValues.archived : formData.get("archived"),
    chain: historic ? originalValues.chain : formData.get("chain"),
    days: historic ? originalValues.days : formData.getAll("days"),
    name: historic ? originalValues.name : formData.get("name"),
    description: historic ? originalValues.description : formData.get("description"),
    note: formData.get("note"),
    requirements: historic ? originalValues.requirements : formData.get("requirements"),
    streakTarget: formData.get("streakTarget"),
    timeStart: historic ? originalValues.timeStart : formData.get("timeStart"),
    timeEnd: historic ? originalValues.timeEnd : formData.get("timeEnd"),
    defaultPoints: historic ? originalValues.defaultPoints : formData.get("defaultPoints"),
    total: formData.get("total"),
    typeId: historic ? originalValues.type : formData.get("typeId"),
    weight: formData.get("weight"),
  });

  if (validatedFields.data?.archived) {
    validatedFields.data.archived = formatDateTimeISO8601(validatedFields.data.archived as Date);
  }

  if (!historic && validatedFields.data?.typeId) {
    validatedFields.data.typeId = questTypes
      .find((questType: QuestType) => questType.name == validatedFields.data.typeId)!
      .id.replace("_", "-");
  }

  if (!validatedFields.success) {
    const errTree = z.treeifyError(validatedFields.error);
    log.debug(`errors: ${JSON.stringify(validatedFields.error)}`);
    toast.error(JSON.stringify(validatedFields.error));

    return {
      errors: {
        archived: errTree.properties?.archived?.errors,
        chain: errTree.properties?.chain?.errors,
        days: errTree.properties?.days?.errors,
        name: errTree.properties?.name?.errors,
        description: errTree.properties?.description?.errors,
        note: errTree.properties?.note?.errors,
        requirements: errTree.properties?.requirements?.errors,
        streakTarget: errTree.properties?.streakTarget?.errors,
        timeStart: errTree.properties?.timeStart?.errors,
        timeEnd: errTree.properties?.timeEnd?.errors,
        defaultPoints: errTree.properties?.defaultPoints?.errors,
        total: errTree.properties?.total?.errors,
        typeId: errTree.properties?.typeId?.errors,
        weight: errTree.properties?.weight?.errors,
      },
    };
  }

  const originalEditableValues = {
    archived: originalValues.archived,
    chain: originalValues.chain,
    days: originalValues.days,
    name: originalValues.name,
    description: originalValues.description,
    note: originalValues.note,
    requirements: originalValues.requirements,
    streakTarget: originalValues.streakTarget,
    timeEnd: originalValues.timeEnd,
    timeStart: originalValues.timeStart,
    defaultPoints: originalValues.defaultPoints,
    total: originalValues.total,
    typeId: originalValues.type,
    weight: originalValues.weight,
  };

  // @ts-expect-error: 2345, validatedFields.data as Daily
  return utils.getObjectDifferences<Daily>(originalEditableValues, validatedFields.data);
}
