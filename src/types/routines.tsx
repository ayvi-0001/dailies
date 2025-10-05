type int = BigInteger;

export type Routine = {
  ordinalPos: int;
  valueId: string;
  routineId: string;
  name: string;
  group: string;
  type: string;
  maxValue: number;
  notes: string | null;
  nDays: BigInteger | null;
  weekdays: string | null;
  date: Date;
  dateStarted: Date;
  dateArchived: Date | null;
  value: number | null;
  weight: number;
  weightedValue: number | null;
  // convert NaiveTime from rs to ts?
  timeMin: string | null;
  timeMax: string | null;
  timeBucketMin: BigInteger;
  timeBucketMax: BigInteger;
};

export type Section = {
  title: string;
  totalWeight: number;
};
