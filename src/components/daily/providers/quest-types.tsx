"use client";

import * as React from "react";

import * as ReactUse from "@reactuses/core";
import { ClassValue } from "clsx";
import { Result, err, ok } from "neverthrow";
import { toast } from "sonner";

import { queryQuestTypes } from "@/actions/query";

export const dynamic = "force-dynamic";

const QuestTypesContext = React.createContext<Result<QuestType[], Error>>(
  err(new Error("Quest Types was used outside of its Provider")),
);

export function useQuestTypes(): QuestType[] {
  return React.useContext(QuestTypesContext).match(
    (t) => t,
    (e) => { throw e; },
  );
}

export default function QuestTypesProvider({
  children,
}: Readonly<{ children?: React.ReactNode }>): React.ReactElement {
  const [questTypes, setQuestTypes] = React.useState<QuestType[]>([]);

  ReactUse.useOnceEffect(() => {
    queryQuestTypes()
      .andTee((t) => setQuestTypes(t))
      .mapErr((e) => { toast.error(e.title, { description: e.message }); });
  }, []);

  return <QuestTypesContext.Provider value={ok(questTypes)}>{children}</QuestTypesContext.Provider>;
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
