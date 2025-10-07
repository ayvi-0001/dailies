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
}

export type Section = {
  title: string;
  totalWeight: number;
};
