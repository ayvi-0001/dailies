export interface Routine {
  name: string;
  group: string;
  type: string;
  maxValue: number;
  value: number | null;
  weight: number;
  weightedValue: number | null;
  timeMin: string | null;
  timeMax: string | null;
  notes: string | null;
  weekDays: number[];
}

export interface Section {
  title: string;
}
