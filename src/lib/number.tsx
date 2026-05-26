export function roundTo(num: number, precision: number): number {
  const factor: number = Math.pow(10, precision);
  return Math.round(num * factor) / factor;
}

export function isRealNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function isNumeric(s: string): boolean {
  return !isNaN(+s) && isFinite(+s) && !/e/i.test(s);
}
