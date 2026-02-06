"use client";

import * as React from "react";

import * as ReactUse from "@reactuses/core";
import { now, today } from "@internationalized/date";
import ok from "assert";
import { ReadonlyURLSearchParams, useSearchParams } from "next/navigation";

import { User, useState as useUserState } from "@/app/providers/user";
import { LOCAL_TZ, formatDateTimeISO8601 } from "@/lib/dates";
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
  countRefreshDailies: number;
  setCountRefreshDailies: React.Dispatch<React.SetStateAction<number>>;
  triggerRefreshDailies: () => void;
  isLoading: boolean;
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
  }, [user, countRefreshDailies, date]);

  ReactUse.useOnceEffect(() => {
    const get_total_points = async (): Promise<void> => {
      await invoke<{
        total_points: number;
        total_weight: number;
      }>("get_total_points", {
        user: user.name,
        date: date,
      })
        .then(result => {
          setTotalWeight(result.total_weight);
          setTotalPoints(result.total_points);
        })
        .catch(console.error);
    };
    get_total_points();
  }, [user, countRefreshDailies, date]);

  const triggerRefreshDailies: () => void = React.useCallback(() => {
    setCountRefreshDailies(countRefreshDailies + 1);
    console.debug(`countRefreshDailies=${countRefreshDailies}`);
  }, [countRefreshDailies]);

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

    const getMsToMidnight = (): number => {
      const currentDateTime = now(LOCAL_TZ);
      const midnight = currentDateTime
        .cycle("day", 1)
        .cycle("hour", 24 - currentDateTime.hour)
        .cycle("minute", 60 - currentDateTime.minute)
        .cycle("second", 60 - currentDateTime.second)
        .cycle("millisecond", 1000 - currentDateTime.millisecond);
      const timeToMidnight = midnight.compare(currentDateTime);

      return timeToMidnight;
    };

    const timeoutId = setTimeout(() => {
      midnightDailyRefresh();
      const intervalId = setInterval(midnightDailyRefresh, 24 * 60 * 60 * 1000);
      return () => clearInterval(intervalId);
    }, getMsToMidnight());

    return () => clearTimeout(timeoutId);
  }, []);

  const value: DailiesState = {
    date,
    dailies,
    setDailies,
    questChains,
    totalPoints,
    setTotalPoints,
    totalWeight,
    setTotalWeight,
    countRefreshDailies,
    setCountRefreshDailies,
    triggerRefreshDailies,
    isLoading,
  };

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
