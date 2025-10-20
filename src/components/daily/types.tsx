/* eslint-disable @typescript-eslint/no-namespace */
import type { Option } from "@/types/option";

export type Daily = {
  user: Readonly<string>;
  date: Readonly<Date>;
  pointId: Readonly<string>;
  questId: Readonly<string>;
  sequence: number;
  chain: string;
  name: string;
  type: Daily.Type;
  points: Option<number>;
  total: number;
  weight: number;
  streakTarget: Option<number>;
  requirements: Option<unknown>;
  timeMin: Option<string>;
  timeMax: Option<string>;
  accepted: Readonly<Date>;
  archived: Option<Date>;
  days: Option<number[]>;
  note: Option<string>;
  streak: Readonly<Option<number>>;
  complete: Readonly<Option<number>>;
  pointsWeighted: Readonly<Option<number>>;
};

export namespace Daily {
  export const RustTypes = {
    user: "String",
    date: "NaiveDate",
    pointId: "String",
    questId: "String",
    sequence: "i64",
    chain: "String",
    name: "String",
    type: "DailyType",
    points: "Option<f64>",
    total: "f64",
    weight: "f64",
    streakTarget: "Option<i64>",
    requirements: "Option<Json<Value>>",
    timeMin: "Option<NaiveTime>",
    timeMax: "Option<NaiveTime>",
    accepted: "NaiveDateTime",
    archived: "Option<NaiveDateTime>",
    days: "Option<Json<Vec<i64>>>",
    note: "Option<String>",
    streak: "Option<i64>",
    complete: "Option<f64>",
    pointsWeighted: "Option<f64>",
  } as const;

  export enum QuestChain {
    // TODO(ayvi): pull chains
  }

  export enum Type {
    q_d_b = "q-d-b",
    q_d_n = "q-d-n",
    q_d_c = "q-d-c",
    q_d_c_d = "q-d-c-d",
    q_d_cy = "q-d-cy",
    q_d_i = "q-d-i",
    q_p = "q-p",
    q_sc_c = "q-sc-c",
    q_w_b = "q-w-b",
    q_w_n = "q-w-n",
    q_ln_n = "q-ln-n",
    q_ln_b = "q-ln-b",
    q_x = "q-x",
  }

  export namespace Type {
    export function values(): Daily.Type[] {
      return Object.values(Daily.Type).filter(v => typeof v !== "function")!;
    }

    export function find(str: string): Daily.Type {
      return Daily.Type.values()
        .filter(e => e == str)
        .at(0)!;
    }
  }
}
