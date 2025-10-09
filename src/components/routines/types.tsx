import type { Option } from "@/types/option";

export type Routine = {
  ordinalPos: Readonly<number>;
  valueId: Readonly<string>;
  routineId: Readonly<string>;
  name: string;
  group: Routine.Group;
  type: Routine.Type;
  maxValue: number;
  notes: Option<string>;
  nDays: Option<number>;
  streak: Option<number>;
  weekdays: Option<string>;
  date: Readonly<Date>;
  dateStarted: Readonly<Date>;
  dateArchived: Option<Date>;
  value: Option<number>;
  weight: number;
  weightedValue: Readonly<Option<number>>;
  timeMin: Option<string>; // convert NaiveTime from rs to ts?
  timeMax: Option<string>;
  timeBucketMin: number;
  timeBucketMax: number;
};

export namespace Routine {
  export const RustTypes = {
    ordinalPos: "i32",
    valueId: "String",
    routineId: "String",
    name: "String",
    group: "String",
    type: "Enum<DailyType>",
    maxValue: "Decimal",
    notes: "Option<String>",
    streak: "Option<i32>",
    nDays: "Option<i32>",
    weekdays: "Option<String>",
    dateArchived: "Option<NaiveDate>",
    value: "Option<Decimal>",
    weight: "Decimal",
    weightedValue: "Option<Decimal>",
    timeMin: "Option<NaiveTime>",
    timeMax: "Option<NaiveTime>",
    timeBucketMin: "Option<i32>",
    timeBucketMax: "Option<i32>",
  } as const;

  export enum Group {
    rg1 = "rg1",
    rg2 = "rg2",
    rg3 = "rg3",
    rg4 = "rg4",
  }

  export enum Type {
    r_d_b = "r-d-b",
    r_d_n = "r-d-n",
    r_d_c_d = "r-d-c-d",
    r_ln_b = "r-ln-b",
    r_d_cy = "r-d-cy",
    r_sc_c = "r-sc-c",
    r_d_st_n = "r-d-st-n",
  }

  export namespace Type {
    export function values(): Routine.Type[] {
      return Object.values(Routine.Type).filter(v => typeof v !== "function")!;
    }

    export function find(str: string): Routine.Type {
      return Routine.Type.values()
        .filter(e => e == str)
        .at(0)!;
    }
  }
}

export type Section = {
  title: string;
  totalWeight: number;
};
