export function roundTo(num: number, precision: number): number {
  const factor: number = Math.pow(10, precision);
  return Math.round(num * factor) / factor;
}
