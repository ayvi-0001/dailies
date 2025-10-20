import { type ClassValue, clsx } from "clsx";

import { Daily } from "../types";

export default function getAccentClasses<_T extends keyof typeof Daily.QuestChain>(
  _chain: string,
): { bgColor: string; borderColor: string } {
  // const _ = Daily.QuestChain[chain as T];

  const borderColor: ClassValue = clsx(
    "border-yellow-500/70",
    // accentColor === Daily.QuestChain.rg1 && "border-yellow-500/70",
    // accentColor === Daily.QuestChain.rg2 && "border-slate-500/70",
    // accentColor === Daily.QuestChain.rg3 && "border-teal-500/70",
    // accentColor === Daily.QuestChain.rg4 && "border-fuchsia-500/70",
  );

  const bgColor: ClassValue = clsx(
    "bg-yellow-400/80",
    // accentColor === Daily.QuestChain.rg1 && "bg-yellow-900",
    // accentColor === Daily.QuestChain.rg2 && "bg-slate-900",
    // accentColor === Daily.QuestChain.rg3 && "bg-teal-900",
    // accentColor === Daily.QuestChain.rg4 && "bg-fuchsia-900",
  );

  return {
    bgColor,
    borderColor,
  };
}
