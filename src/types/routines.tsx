export interface Routine {
  value_id: string;
  routine_id: string;
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
  weekdays: number[];
}

export interface Section {
  title: string;
}
