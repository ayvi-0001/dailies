export interface Routine {
  name: string;
  group: string;
  type: string;
  maxValue: number;
  value: number;
  weight: number;
  weightedValue: number;
  timeMin: string;
  timeMax: string;
}

export interface Section {
  title: string;
}
