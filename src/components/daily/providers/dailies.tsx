"use client";

import * as React from "react";

import * as ReactUse from "@reactuses/core";
import { today } from "@internationalized/date";
import ok from "assert";
import { ReadonlyURLSearchParams, useSearchParams } from "next/navigation";

import { User, useState as useUserState } from "@/app/providers/user";
import { LOCAL_TZ, formatDateTimeISO8601, getMsToMidnight } from "@/lib/dates";
import { invoke } from "@/lib/tauri";
import { Option } from "@/types/option";

import { Daily, QuestChain } from "../types";
import QuestTypesProvider from "./quest-types";

export const dynamic = "force-dynamic";

export type DailiesState = {
  date: string;
  dailies: Daily[];
  setDailies: React.Dispatch<React.SetStateAction<Daily[]>>;
  questChains: string[];
  totalPoints: number;
  setTotalPoints: React.Dispatch<React.SetStateAction<number>>;
  totalWeight: number;
  setTotalWeight: React.Dispatch<React.SetStateAction<number>>;
  triggerRefreshDailies: () => void;
  isLoading: boolean;
  updateDaily: (pointId: string, patch: Partial<Daily>) => void;
};

export const DailiesContext = React.createContext<Option<DailiesState>>(null);

type DailiesProviderProps = {
  children?: Readonly<React.ReactNode>;
};

export default function DailiesProvider(props: DailiesProviderProps): React.ReactElement {
  const [dailies, setDailies] = React.useState<Daily[]>([]);
  const [questChains, setQuestChains] = React.useState<string[]>([]);
  const [totalPoints, setTotalPoints] = React.useState<number>(0);
  const [totalWeight, setTotalWeight] = React.useState<number>(0);

  const [countRefreshDailies, setCountRefreshDailies] = React.useState<number>(0);
  const [countRefreshQuestChains, setCountRefreshQuestChains] = React.useState<number>(0);

  const [isLoading, setIsLoading] = React.useState<boolean>(true);

  const searchParams: ReadonlyURLSearchParams = useSearchParams();

  const user: User = useUserState().user;

  const date: string = searchParams.get("date") ?? today(LOCAL_TZ).toString();

  ReactUse.useOnceEffect(() => {
    setIsLoading(true);
    setTotalWeight(0);
    setTotalPoints(0);
  }, [date]);

  ReactUse.useOnceEffect(() => {
    const query_dailies = async (): Promise<void> => {
      await invoke<Daily[]>("query_dailies", {
        user: user.name,
        quest_id: null, // pull all dailies
        start_date: date,
        end_date: date,
      })
        .then(result => {
          setDailies(result);
          setIsLoading(false);
        })
        .catch(console.error);
    };
    query_dailies();
  }, [user, countRefreshDailies, date]);

  ReactUse.useOnceEffect(() => {
    const query_quest_chains = async (): Promise<void> => {
      await invoke<QuestChain[]>("query_quest_chains", { user_id: user.id })
        .then(quest_chains => setQuestChains(quest_chains.map(value => value.chain)))
        .catch(console.error);
    };
    query_quest_chains();
  }, [user, countRefreshQuestChains]);

  ReactUse.useOnceEffect(() => {
    const points: Readonly<Option<number>>[] = dailies
      ?.filter(d => d.points !== null)
      ?.map(d => d.pointsWeighted);
    if (points.length > 0) {
      const totalPoints = points.reduce(
        (acc: Readonly<Option<number>>, n: Readonly<Option<number>>) => acc! + n!,
      );
      setTotalPoints(totalPoints as number);
    }
  }, [user, countRefreshDailies, dailies, date]);

  ReactUse.useOnceEffect(() => {
    const weights: Readonly<Option<number>>[] = dailies
      ?.filter(d => d.points !== null)
      ?.map(d => d.weight);
    if (weights.length > 0) {
      const totalWeight = weights.reduce(
        (acc: Readonly<Option<number>>, n: Readonly<Option<number>>) => acc! + n!,
      );
      setTotalWeight(totalWeight as number);
    }
  }, [user, countRefreshDailies, dailies, date]);

  const debouncedRefreshRef = React.useRef<ReturnType<typeof setTimeout>>(undefined);
  const triggerRefreshDailies = React.useCallback(() => {
    clearTimeout(debouncedRefreshRef.current);
    debouncedRefreshRef.current = setTimeout(() => {
      setCountRefreshDailies(c => c + 1);
    }, 300);
  }, []);

  React.useEffect(() => {
    return () => clearTimeout(debouncedRefreshRef.current);
  }, []);

  const triggerRefreshQuestChains = React.useCallback(
    () => setCountRefreshQuestChains(c => c + 1),
    [],
  );

  const updateDaily = React.useCallback(
    (pointId: string, patch: Partial<Daily>) => {
      setDailies(prev => prev.map(d => (d.pointId === pointId ? { ...d, ...patch } : d)));

      const patchKeys = Object.keys(patch);
      if (patchKeys.filter(k => ["points", "weight", "archived"].includes(k)).length > 0) {
        triggerRefreshDailies();
      } else if (patchKeys.includes("chain")) {
        triggerRefreshQuestChains();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  ReactUse.useOnceEffect(() => {
    const insert_dailies = async (): Promise<void> => {
      await invoke("insert_dailies", {
        datetime: formatDateTimeISO8601(today(LOCAL_TZ).toDate(LOCAL_TZ), true),
      });
    };
    const query_dailies = async (): Promise<void> => {
      setIsLoading(true);
      await invoke<Daily[]>("query_dailies", {
        user: user.name,
        quest_id: null, // pull all dailies
        start_date: date,
        end_date: date,
      })
        .then(result => {
          setDailies(result);
          setIsLoading(false);
        })
        .catch(console.error);
    };

    const midnightDailyRefresh = (): void => {
      insert_dailies();
      query_dailies();
    };

    const timeoutId = setTimeout(() => {
      midnightDailyRefresh();
      const intervalId = setInterval(midnightDailyRefresh, 24 * 60 * 60 * 1000);
      return () => clearInterval(intervalId);
    }, getMsToMidnight());

    return () => clearTimeout(timeoutId);
  }, []);

  const value: DailiesState = React.useMemo(() => {
    return {
      date,
      dailies,
      setDailies,
      questChains,
      totalPoints,
      setTotalPoints,
      totalWeight,
      setTotalWeight,
      triggerRefreshDailies,
      isLoading,
      updateDaily,
    };
  }, [
    date,
    dailies,
    questChains,
    totalPoints,
    totalWeight,
    triggerRefreshDailies,
    isLoading,
    updateDaily,
  ]);

  return (
    <>
      <QuestTypesProvider>
        <DailiesContext.Provider value={value}>{props.children}</DailiesContext.Provider>
      </QuestTypesProvider>
    </>
  );
}

export function useDailies(): DailiesState {
  const context: Option<DailiesState> = React.useContext(DailiesContext);
  ok(context, new Error("useDailies was used outside of its Provider"));
  return context;
}
