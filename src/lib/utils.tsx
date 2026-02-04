import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function call<T>(callable: () => T): T {
  return callable();
}

export async function callAsync<T>(callable: () => T): Promise<Awaited<T>> {
  return await callable();
}

export function getObjectDifferences<T extends Record<string, unknown>>(
  obj1: T,
  obj2: T,
): Partial<T> {
  const diff: Partial<T> = {};

  // Find keys present in obj1 but not in obj2, or with different values
  for (const key in obj1) {
    if (Object.prototype.hasOwnProperty.call(obj1, key)) {
      const val1 = obj1[key];
      const val2 = obj2[key];

      if (Array.isArray(val1) && Array.isArray(val2)) {
        const arrayDiff = getArrayDifference(val1, val2);
        if (arrayDiff.length > 0) {
          diff[key] = val2 as T[Extract<keyof T, string>];
        }
      } else if (
        typeof val1 === "object" &&
        val1 !== null &&
        typeof val2 === "object" &&
        val2 !== null
      ) {
        // Recursively compare nested objects
        const nestedDiff = getObjectDifferences(
          val1 as Record<string, unknown>,
          val2 as Record<string, unknown>,
        );
        if (Object.keys(nestedDiff).length > 0) {
          diff[key] = nestedDiff as T[Extract<keyof T, string>];
        }
      } else if (val1 !== val2) {
        diff[key] = val2;
      }
    }
  }

  // Find keys present in obj2 but not in obj1
  for (const key in obj2) {
    if (
      Object.prototype.hasOwnProperty.call(obj2, key) &&
      !Object.prototype.hasOwnProperty.call(obj1, key)
    ) {
      diff[key] = obj2[key];
    }
  }

  return diff;
}

function getArrayDifference<T>(arr1: T[], arr2: T[]): T[] {
  const diff: T[] = [];
  const set2 = new Set(arr2);

  // Elements in arr1 but not in arr2
  for (const item of arr1) {
    if (!set2.has(item)) {
      diff.push(item);
    }
  }

  // Elements in arr2 but not in arr1
  const set1 = new Set(arr1);
  for (const item of arr2) {
    if (!set1.has(item)) {
      diff.push(item);
    }
  }

  return diff;
}

export function identicalArrays<T>(arr1: T[], arr2: T[]): boolean {
  if (arr1.length !== arr2.length) {
    return false;
  }
  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) {
      return false;
    }
  }
  return true;
}
