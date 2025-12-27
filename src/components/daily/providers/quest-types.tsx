"use client";

import * as React from "react";

import { useOnceEffect } from "@reactuses/core";
import ok from "assert";
import { ClassValue } from "clsx";

import { invoke } from "@/lib/tauri";

export const dynamic = "force-dynamic";

export const QuestTypesContext = React.createContext<QuestType[] | null>(null);

export default function QuestTypesProvider({
  children,
}: Readonly<{ children?: React.ReactNode }>): React.ReactElement {
  const [questTypes, setQuestTypes] = React.useState<QuestType[]>([]);

  useOnceEffect(() => {
    const get_quest_types = async (): Promise<void> => {
      await invoke<QuestType[]>("get_quest_types", {})
        .then(result => setQuestTypes(result))
        .catch(console.error);
    };
    get_quest_types();
  }, []);

  return <QuestTypesContext.Provider value={questTypes}>{children}</QuestTypesContext.Provider>;
}

export function useQuestTypes(): QuestType[] {
  const context: QuestType[] | null = React.useContext(QuestTypesContext);
  ok(context, new Error("useQuestTypes was used outside of its Provider"));
  return context;
}

export type QuestType = {
  id: string;
  name: string;
  description: string;
  available: boolean;
  styles: QuestTypeStyles;
};

export type QuestTypeStyles = {
  typeBadgeClass: ClassValue;
  borderClass: ClassValue;
  bgClass: ClassValue;
};

export const DEFAULT_QUEST_TYPE_STYLES = {
  typeBadgeClass: "",
  bgClass: "",
  borderClass: "",
} as const;
