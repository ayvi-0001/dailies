import * as log from "@tauri-apps/plugin-log";
import { toast } from "sonner";
import { z } from "zod";

import { Daily, Quest } from "@/components/daily";
import { QuestType } from "@/components/daily/providers/quest-types";
import { formatDateTimeISO8601 } from "@/lib/dates";
import { FormState } from "@/lib/forms";
import { camelCaseToSnakeCase } from "@/lib/string";
import { invoke } from "@/lib/tauri";
import Utils from "@/lib/utils";

export default async function editQuest(
  _state: FormState,
  formData: FormData,
  originalValues: Daily,
  questTypes: QuestType[],
  userId: number,
  historic?: boolean,
): Promise<FormState | Partial<Daily>> {
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
      [`${Quest.Type.QR}`, `${Quest.Type.QW}`].includes(originalValues.type) &&
      ![`${Quest.Type.QR}`, `${Quest.Type.QW}`].includes(validatedFields.data?.typeId)
    ) {
      validatedFields.data.days = originalValues.days;
      validatedFields.data.timeStart = originalValues.timeStart;
      validatedFields.data.timeEnd = originalValues.timeEnd;
    }
  }

  await log.debug(
    Array.from([
      `validatedFields: `,
      JSON.stringify(validatedFields.data, Utils.sortKeysReplacer, 2),
    ]).join(""),
  );
  await log.debug(
    Array.from([
      `originalValues: `,
      JSON.stringify(originalValues, Utils.sortKeysReplacer, 2),
    ]).join(""),
  );

  if (!validatedFields.success) {
    const errTree = z.treeifyError(validatedFields.error);
    await log.debug(`errors: ${JSON.stringify(validatedFields.error, Utils.sortKeysReplacer, 2)}`);
    toast.error(JSON.stringify(validatedFields.error));

    return {
      errors: {
        archived: errTree.properties?.archived?.errors ?? null,
        chain: errTree.properties?.chain?.errors ?? null,
        days: errTree.properties?.days?.errors ?? null,
        name: errTree.properties?.name?.errors ?? null,
        description: errTree.properties?.description?.errors ?? null,
        note: errTree.properties?.note?.errors ?? null,
        requirements: errTree.properties?.requirements?.errors ?? null,
        streakTarget: errTree.properties?.streakTarget?.errors ?? null,
        timeStart: errTree.properties?.timeStart?.errors ?? null,
        timeEnd: errTree.properties?.timeEnd?.errors ?? null,
        defaultPoints: errTree.properties?.defaultPoints?.errors ?? null,
        total: errTree.properties?.total?.errors ?? null,
        typeId: errTree.properties?.typeId?.errors ?? null,
        weight: errTree.properties?.weight?.errors ?? null,
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

  const diffEntries: [string, unknown][] = Object.entries(diff);
  const diffKeys = diffEntries.map((v) => v[0]);

  // Make sure if `name` is updated to run it last due to id updates
  if (diffKeys.includes("name")) {
    diffEntries.push(diffEntries.splice(diffKeys.indexOf("name"), 1)[0]);
  }

  for (const entry of diffEntries) {
    const key = entry[0];
    const value = entry[1];

    await invoke(`update_${camelCaseToSnakeCase(key)}`, {
      user_id: userId,
      quest_id: originalValues.questId,
      point_id: originalValues.pointId,
      value: typeof value === "boolean" ? !!value : value,
    }).catch((_) => {
      if (key === "name") {
        toast.error(`A quest with the same name and quest chain already exists.`);
        delete diff.name;
      }
    });
  }

  await log.debug(
    Array.from([
      originalValues.pointId,
      `Edit patch:`,
      JSON.stringify(diff, Utils.sortKeysReplacer, 2),
    ]).join(" "),
  );

  return diff;
}
