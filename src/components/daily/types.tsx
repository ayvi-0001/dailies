/* eslint-disable @typescript-eslint/no-namespace */
import { parseDateTime } from "@internationalized/date";
import { z } from "zod";
import { SomeType, _$ZodTypeInternals } from "zod/v4/core";

import { LOCAL_TZ, formatDateTimeISO8601 } from "@/lib/dates";
import type { Option } from "@/types/option";

export type Daily = {
  user: Readonly<string>;
  date: Readonly<Date>;
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
  accepted: Readonly<Date>;
  archived: Option<Date>;
  days: Option<number[]>;
  description: Option<string>;
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
  accepted: Readonly<Date>;
  archived: Option<Date>;
  days: number[];
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
    userId: z.string().transform((arg: string, _: z.core.$RefinementCtx<string>) => parseInt(arg)),
    chain: z.string().nonempty(),
    name: z.string().nonempty(),
    typeId: z.string(),
    total: z.coerce.number<number>().gt(0),
    defaultPoints: z.coerce.number<number>().gte(0),
    weight: z.coerce.number<number>().gt(0),
    streakTarget: z.preprocess<Option<number>, SomeType, number>( val => (`${val}` === "" ? null : val), z.coerce.number<number>().nullable()),
    requirements: z.preprocess<Option<unknown>, SomeType, unknown>( val => { if (!val) { return null } else { return val } }, z.any().nullable()),
    timeStart: z.preprocess<Option<string>, SomeType, string>( val => (`${val}` === "" ? null : val), z.iso.time().nullable()),
    timeEnd: z.preprocess<Option<string>, SomeType, string>( val => (`${val}` === "" ? null : val), z.iso.time().nullable()),
    accepted: z.coerce.date<Option<Date>>().nullable().transform((arg: Option<Date>) => (arg ? formatDateTimeISO8601(arg) : null)),
    days: z.preprocess<number[], SomeType, string[]>( val => (val.length === 0 ? [] : val.map(v => parseInt(v))), z.array(z.number())),
    description: z.preprocess<Option<string>, SomeType, string>( val => (val === "" ? null : val), z.string().nullable()),
  });

  // prettier-ignore
  export const EditQuestFormSchema = z.object({
    archived: z.preprocess<Option<Date>, SomeType, string | null>(val => val ? parseDateTime(val).toDate(LOCAL_TZ) : null, z.coerce.date().nullable()),
    chain: z.string().nonempty(),
    days: z.preprocess<number[], SomeType, string[]>( val => (val.length === 0 ? [] : val.map(v => parseInt(v))), z.array(z.number())),
    name: z.string().nonempty(),
    description: z.preprocess<Option<string>, SomeType, string>( val => (val === "" ? null : val), z.string().nullable()),
    requirements: z.preprocess<Option<unknown>, SomeType, unknown>( val => { if (!val) { return null } else { return val } }, z.any().nullable()),
    streakTarget: z.preprocess<Option<number>, SomeType, number>( val => (`${val}` === "" ? null : val), z.coerce.number<number>().nullable()),
    timeStart: z.preprocess<Option<string>, SomeType, string>( val => (`${val}` === "" ? null : val), z.iso.time().nullable()),
    timeEnd: z.preprocess<Option<string>, SomeType, string>( val => (`${val}` === "" ? null : val), z.iso.time().nullable()),
    defaultPoints: z.coerce.number<number>().gte(0),
    total: z.coerce.number<number>().gt(0),
    typeId: z.string(),
    weight: z.coerce.number<number>().gt(0),
  });
}
