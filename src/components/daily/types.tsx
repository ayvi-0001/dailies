/* eslint-disable @typescript-eslint/no-namespace */
import { parseDateTime } from "@internationalized/date";
import { z } from "zod";
import { SomeType, _$ZodTypeInternals } from "zod/v4/core";

import { LOCAL_TZ, formatDateTimeISO8601 } from "@/lib/dates";
import type { Option } from "@/types/option";

export type Daily = {
  user: Readonly<string>;
  // TODO(ayvi): set type to Date
  date: Readonly<string>;
  pointId: Readonly<string>;
  questId: Readonly<string>;
  sequence: number;
  chain: string;
  name: string;
  type: string;
  points: Option<number>;
  defaultPoints: number;
  total: number;
  weight: number;
  streakTarget: Option<number>;
  requirements: Option<unknown>;
  timeStart: Option<string>;
  timeEnd: Option<string>;
  // TODO(ayvi): set type to Date
  accepted: Readonly<string>;
  archived: Option<string>;
  days: Option<number[]>;
  description: Option<string>;
  note: Option<string>;
  streak: Readonly<Option<number>>;
  complete: Readonly<Option<number>>;
  pointsWeighted: Readonly<Option<number>>;
};

export type Quest = {
  id: Readonly<string>;
  sequence: number;
  chain: string;
  name: string;
  type: string;
  total: number;
  weight: number;
  streakTarget: Option<number>;
  requirements: Option<unknown>;
  timeStart: Option<string>;
  timeEnd: Option<string>;
  // TODO(ayvi): set type to Date
  accepted: Readonly<string>;
  archived: Option<string>;
  days: Option<number[]>;
  description: Option<string>;
  streak: Readonly<Option<number>>;
};

export type QuestChain = {
  id: Readonly<number>;
  user_id: Readonly<number>;
  chain: string;
  sequence: number;
  collapsed: boolean;
};

export namespace Quest {
  export enum Type {
    /** Daily */
    QD = "q-d",
    /** Weekly */
    QW = "q-w",
    /** Daily/Maintenance */
    QDm = "q-dm",
    /** Weekly [S] */
    QWS = "q-w-s",
    /** Weekly [M] */
    QWM = "q-w-m",
    /** Raid */
    QR = "q-r",
    /** Optional */
    QO = "q-o",
    /** Persistent */
    QP = "q-p",
    /** Monthly */
    QM = "q-m",
    /** Event */
    QE = "q-e",
  }

  // prettier-ignore
  export const NewQuestFormSchema = z.object({
    accepted: z.coerce.date<Option<Date>>().nullable().transform((arg: Option<Date>) => (arg ? formatDateTimeISO8601(arg) : null)),
    chain: z.string().nonempty(),
    days: z.preprocess<Option<number[]>, SomeType, Option<string[]>>(val => (val && val?.length > 0 ? val.map(v => parseInt(v)) : null), z.array(z.number()).nullable()),
    defaultPoints: z.coerce.number<number>().gte(0),
    description: z.preprocess<Option<string>, SomeType, string>(val => (val === "" ? null : val), z.string().nullable()),
    name: z.string().nonempty(),
    requirements: z.preprocess<Option<unknown>, SomeType, unknown>(val => { if (!val) { return null } else { return val } }, z.any().nullable()),
    streakTarget: z.preprocess<Option<number>, SomeType, number>(val => (`${val}` === "" ? null : val), z.coerce.number<number>().nullable()),
    timeEnd: z.preprocess<Option<string>, SomeType, string>(val => (`${val}` === "" ? null : val), z.iso.time().nullable()),
    timeStart: z.preprocess<Option<string>, SomeType, string>(val => (`${val}` === "" ? null : val), z.iso.time().nullable()),
    total: z.coerce.number<number>().gt(0),
    typeId: z.string(),
    userId: z.string().transform((arg: string, _: z.core.$RefinementCtx<string>) => parseInt(arg)),
    weight: z.coerce.number<number>().gt(0),
  });

  // prettier-ignore
  export const EditQuestFormSchema = z.object({
    archived: z.preprocess<Option<Date>, SomeType, Option<string>>(val => val ? parseDateTime(val).toDate(LOCAL_TZ) : null, z.coerce.date().nullable()),
    chain: z.string().nonempty(),
    days: z.preprocess<Option<number[]>, SomeType, Option<string[]>>(val => (val && val?.length > 0 ? val.map(v => parseInt(v)) : null), z.array(z.number()).nullable()),
    defaultPoints: z.coerce.number<number>().gte(0),
    description: z.preprocess<Option<string>, SomeType, string>(val => (val === "" ? null : val), z.string().nullable()),
    name: z.string().nonempty(),
    note: z.preprocess<Option<string>, SomeType, string>(val => (val === "" ? null : val), z.string().nullable()),
    requirements: z.preprocess<Option<unknown>, SomeType, unknown>(val => { if (!val) { return null } else { return val } }, z.any().nullable()),
    streakTarget: z.preprocess<Option<number>, SomeType, number>(val => (`${val}` === "" ? null : val), z.coerce.number<number>().nullable()),
    timeEnd: z.preprocess<Option<string>, SomeType, string>(val => (`${val}` === "" ? null : val), z.iso.time().nullable()),
    timeStart: z.preprocess<Option<string>, SomeType, string>(val => (`${val}` === "" ? null : val), z.iso.time().nullable()),
    total: z.coerce.number<number>().gt(0),
    typeId: z.string(),
    weight: z.coerce.number<number>().gt(0),
  });
}
