export type Routine = {
  ordinalPos: Readonly<number>;
  valueId: Readonly<string>;
  routineId: Readonly<string>;
  name: string;
  group: string;
  type: RoutineType;
  maxValue: number;
  notes: string | null;
  nDays: number | null;
  streak: number | null;
  weekdays: string | null;
  date: Readonly<Date>;
  dateStarted: Readonly<Date>;
  dateArchived: Date | null;
  value: number | null;
  weight: number;
  weightedValue: Readonly<number | null>;
  timeMin: string | null; // convert NaiveTime from rs to ts?
  timeMax: string | null;
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
}

/**
 * Used for type-checking a string against available attributes on Routine
 */
export type RoutineAttrs =
  | "ordinalPos"
  | "valueId"
  | "routineId"
  | "name"
  | "group"
  | "type"
  | "maxValue"
  | "notes"
  | "nDays"
  | "streak"
  | "weekdays"
  | "date"
  | "dateStarted"
  | "dateArchived"
  | "value"
  | "weight"
  | "weightedValue"
  | "timeMin"
  | "timeMax"
  | "timeBucketMin"
  | "timeBucketMax";

export enum RoutineType {
  r_d_b = "r-d-b",
  r_d_n = "r-d-n",
  r_d_c_d = "r-d-c-d",
  r_ln_b = "r-ln-b",
  r_d_cy = "r-d-cy",
  r_sc_c = "r-sc-c",
  r_d_st_n = "r-d-st-n",
}

export namespace RoutineType {
  export function values(): RoutineType[] {
    return Object.values(RoutineType).filter(v => typeof v !== "function")!;
  }

  export function find(str: string): RoutineType {
    return RoutineType.values()
      .filter(e => e == str)
      .at(0)!;
  }
}

export type Section = {
  title: string;
  totalWeight: number;
};
