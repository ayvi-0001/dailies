import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import type { ReadonlyURLSearchParams } from "next/navigation";

export const createQueryString = (
  searchParams: ReadonlyURLSearchParams,
  values: Array<{ key: string; value: string }>,
): string => {
  const params = new URLSearchParams(searchParams);
  for (const { key, value } of values) {
    params.set(key, value);
  }
  return params.toString();
};

export const updateParam = (
  router: AppRouterInstance,
  searchParams: ReadonlyURLSearchParams,
  values: Array<{ key: string; value: string }>,
): void => {
  const href = `?${createQueryString(searchParams, values)}`;
  router.push(href);
};
