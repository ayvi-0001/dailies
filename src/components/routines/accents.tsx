import { type ClassValue, clsx } from "clsx";

import { Routine } from "./types";

export default function getAccentClasses<T extends keyof typeof Routine.Group>(
  group: string,
): { bgColor: string; borderColor: string } {
  let accentColor = Routine.Group[group as T];

  const borderColor: ClassValue = clsx(
    accentColor === Routine.Group.rg1 && "border-yellow-500/70",
    accentColor === Routine.Group.rg2 && "border-slate-500/70",
    accentColor === Routine.Group.rg3 && "border-teal-500/70",
    accentColor === Routine.Group.rg4 && "border-fuchsia-500/70",
  );

  const bgColor: ClassValue = clsx(
    accentColor === Routine.Group.rg1 && "bg-yellow-400",
    accentColor === Routine.Group.rg2 && "bg-slate-400",
    accentColor === Routine.Group.rg3 && "bg-teal-400",
    accentColor === Routine.Group.rg4 && "bg-fuchsia-400",
  );

  return {
    bgColor,
    borderColor,
  };
}
