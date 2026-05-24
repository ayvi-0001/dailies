export const roundTo = (num: number, precision: number): number => {
  const factor: number = Math.pow(10, precision);
  return Math.round(num * factor) / factor;
};

export const isRealNumber = (value: unknown): value is number => { return typeof value === "number" && Number.isFinite(value); };

export const isNumeric = (s: string): boolean => {
  const num = +s;
  return !isNaN(num) && isFinite(num) && !/e/i.test(s);
};
