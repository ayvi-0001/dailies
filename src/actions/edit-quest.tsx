import * as log from "@tauri-apps/plugin-log";
import { toast } from "sonner";
import { z } from "zod";

import { Daily, Quest } from "@/components/daily";
import { QuestType } from "@/components/daily/providers/quest-types";
import { formatDateTimeISO8601 } from "@/lib/dates";
import { camelCaseToSnakeCase } from "@/lib/string";
import { invoke } from "@/lib/tauri";
import Utils from "@/lib/utils";

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
  userId: number,
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
    timeStart: formData.get("timeStart"),
    timeEnd: formData.get("timeEnd"),
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

  if (validatedFields.data?.typeId) {
    if (
      [Quest.Type.QR, Quest.Type.QW].includes(originalValues.type) &&
      ![`${Quest.Type.QR}`, `${Quest.Type.QW}`].includes(validatedFields.data?.typeId)
    ) {
      validatedFields.data.days = originalValues.days;
      validatedFields.data.timeStart = originalValues.timeStart;
      validatedFields.data.timeEnd = originalValues.timeEnd;
    }
  }

  log.debug(`validatedFields: ${JSON.stringify(validatedFields.data, Utils.sortKeysReplacer, 2)}`);
  log.debug(`originalValues: ${JSON.stringify(originalValues, Utils.sortKeysReplacer, 2)}`);

  if (!validatedFields.success) {
    const errTree = z.treeifyError(validatedFields.error);
    log.debug(`errors: ${JSON.stringify(validatedFields.error, Utils.sortKeysReplacer, 2)}`);
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

  const diff: Partial<Daily> = Utils.getObjectDifferences<Daily>(
    originalEditableValues as unknown as Daily,
    validatedFields.data as unknown as Daily,
  );

  if (Object.hasOwn(diff, "errors")) return {};

  log.debug(
    `${originalValues.pointId} Edit patch: ${JSON.stringify(diff, Utils.sortKeysReplacer, 2)}`,
  );

  for (const entry of Object.entries(diff)) {
    let key = entry[0];

    const value = entry[1];
    const sendValue = typeof value === "boolean" ? !!value : value;

    if (key == "typeId") key = "type";

    await invoke(`update_${camelCaseToSnakeCase(key)}`, {
      user_id: userId,
      quest_id: originalValues.questId,
      point_id: originalValues.pointId,
      value: sendValue,
    });
  }

  return diff;
}
