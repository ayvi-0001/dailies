"use client";

import * as React from "react";

import { today } from "@internationalized/date";
import { useOnceEffect } from "@reactuses/core";
import ok from "assert";

import * as User from "@/app/providers/user";
import { LOCAL_TZ } from "@/lib/dates";
import { invoke } from "@/lib/tauri";
import { Option } from "@/types/option";

import { Daily } from "../types";
import QuestTypesProvider from "./quest-types";

export const dynamic = "force-dynamic";

export type DailiesState = {
  dailies: Daily[];
  setDailies: React.Dispatch<React.SetStateAction<Daily[]>>;
  questChains: string[];
  totalPoints: number;
  setTotalPoints: React.Dispatch<React.SetStateAction<number>>;
  totalWeight: number;
  setTotalWeight: React.Dispatch<React.SetStateAction<number>>;
  countRefreshDailies: number;
  setCountRefreshDailies: React.Dispatch<React.SetStateAction<number>>;
  triggerRefreshDailies: () => void;
};

export const DailiesContext = React.createContext<DailiesState | null>(null);

export default function DailiesProvider({
  children,
}: Readonly<{ children?: React.ReactNode }>): React.ReactElement {
  const [dailies, setDailies] = React.useState<Daily[]>([]);
  const [questChains, setQuestChains] = React.useState<string[]>([]);
  const [totalPoints, setTotalPoints] = React.useState<number>(0);
  const [totalWeight, setTotalWeight] = React.useState<number>(0);
  const [countRefreshDailies, setCountRefreshDailies] = React.useState<number>(0);

  const userState: User.UserState = User.useState();
  const user: Option<User.User> = userState.user;

  useOnceEffect(() => {
    const now: string = today(LOCAL_TZ).toString();

    const query_dailies = async (): Promise<void> => {
      await invoke<Daily[]>("query_dailies", {
        user: user?.name,
        quest_id: null, // pull all dailies
        start_date: now,
        end_date: now,
      })
        .then(result => setDailies(result))
        .catch(console.error);
    };

    query_dailies();

    const query_quest_chains = async (): Promise<void> => {
      if (user)
        await invoke<string[]>("query_quest_chains", { user_id: user!.id })
          .then(result => setQuestChains(result))
          .catch(console.error);
    };
    query_quest_chains();

    const get_total_points = async (): Promise<void> => {
      await invoke<{
        total_points: number;
        total_weight: number;
      }>("get_total_points", {
        user: user?.name,
        date: now,
      })
        .then(result => {
          setTotalWeight(result.total_weight);
          setTotalPoints(result.total_points);
        })
        .catch(console.error);
    };
    get_total_points();
  }, [user, countRefreshDailies]);

  const triggerRefreshDailies: () => void = React.useCallback(() => {
    console.debug(`countRefreshDailies=${countRefreshDailies}`);
    setCountRefreshDailies(countRefreshDailies + 1);
  }, [countRefreshDailies]);

  const value: DailiesState = {
    dailies: dailies,
    setDailies: setDailies,
    questChains: questChains,
    totalPoints: totalPoints,
    setTotalPoints: setTotalPoints,
    totalWeight: totalWeight,
    setTotalWeight: setTotalWeight,
    countRefreshDailies: countRefreshDailies,
    setCountRefreshDailies: setCountRefreshDailies,
    triggerRefreshDailies: triggerRefreshDailies,
  };

  return (
    <>
      <QuestTypesProvider>
        <DailiesContext.Provider value={value}>{children}</DailiesContext.Provider>
      </QuestTypesProvider>
    </>
  );
}

export function useDailies(): DailiesState {
  const context: DailiesState | null = React.useContext(DailiesContext);
  ok(context, new Error("useDailies was used outside of its Provider"));
  return context;
}
