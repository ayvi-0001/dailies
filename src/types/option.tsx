export type Option<T> = T | null;

export function assert<T>(value: T | null | undefined, err: Error): asserts value is T {
  if (value === null || value === undefined) throw err;
}

export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

export function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}
