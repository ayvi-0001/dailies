"use client";

import * as React from "react";

import * as heroui from "@heroui/react";
import * as ReactUse from "@reactuses/core";
import * as log from "@tauri-apps/plugin-log";
import { CalendarDate, parseDate, today } from "@internationalized/date";
import ok from "assert";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { ReadonlyURLSearchParams, useRouter, useSearchParams } from "next/navigation";

import { User, useState as useUserState } from "@/app/providers/user";
import { LOCAL_TZ, formatDateTimeISO8601, getMsToMidnight } from "@/lib/dates";
import { updateParam } from "@/lib/params";
import { invoke } from "@/lib/tauri";
import { Option } from "@/types/option";

import { Daily, QuestChain } from "../types";
import QuestTypesProvider from "./quest-types";

export const dynamic = "force-dynamic";

export type DailiesState = {
  date: CalendarDate;
  setDate: React.Dispatch<React.SetStateAction<CalendarDate>>;
  dailies: Daily[];
  setDailies: React.Dispatch<React.SetStateAction<Daily[]>>;
  questChains: QuestChain[];
  setQuestChains: React.Dispatch<React.SetStateAction<QuestChain[]>>;
  totalPoints: number;
  setTotalPoints: React.Dispatch<React.SetStateAction<number>>;
  totalWeight: number;
  setTotalWeight: React.Dispatch<React.SetStateAction<number>>;
  triggerRefreshDailies: () => void;
  triggerRefreshQuestChains: () => void;
  isLoading: boolean;
  updateDaily: (daily: Daily, patch: Partial<Daily>) => void;
};

export const DailiesContext = React.createContext<Option<DailiesState>>(null);

type DailiesProviderProps = {
  children?: Readonly<React.ReactNode>;
};

export default function DailiesProvider(props: DailiesProviderProps): React.ReactElement {
  const [dailies, setDailies] = React.useState<Daily[]>([]);
  const [questChains, setQuestChains] = React.useState<QuestChain[]>([]);
  const [totalPoints, setTotalPoints] = React.useState<number>(0);
  const [totalWeight, setTotalWeight] = React.useState<number>(0);

  const [countRefreshDailies, setCountRefreshDailies] = React.useState<number>(0);
  const [countRefreshQuestChains, setCountRefreshQuestChains] = React.useState<number>(0);

  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [isPatching, setIsPatching] = React.useState<boolean>(false);

  const router: AppRouterInstance = useRouter();
  const searchParams: ReadonlyURLSearchParams = useSearchParams();

  const user: User = useUserState().user;

  const [date, setDate] = React.useState<CalendarDate>(today(LOCAL_TZ));

  ReactUse.useOnceEffect(() => {
    if (searchParams.has("date")) setDate(parseDate(searchParams.get("date")!));
  }, []);

  ReactUse.useOnceEffect(() => {
    updateParam(router, searchParams, [{ key: "date", value: date.toString() }]);
  }, [date]);

  ReactUse.useOnceEffect(() => {
    setIsLoading(true);
    setTotalWeight(0);
    setTotalPoints(0);
  }, [date]);

  ReactUse.useOnceEffect(() => {
    setIsPatching(true);
    const query_dailies = async (): Promise<void> => {
      await invoke<Daily[]>("query_dailies", {
        user: user.name,
        quest_id: null, // pull all dailies
        start_date: date.toString(),
        end_date: date.toString(),
      })
        .then((result) => setDailies(result))
        .catch(console.error)
        .finally(() => {
          setIsLoading(false);
          setIsPatching(false);
        });
    };
    query_dailies();
  }, [user, countRefreshDailies, date]);

  ReactUse.useOnceEffect(() => {
    const query_quest_chains = async (): Promise<void> => {
      await invoke<QuestChain[]>("query_quest_chains", { user_id: user.id })
        .then((result) => setQuestChains(result))
        .catch(console.error);
    };
    query_quest_chains();
  }, [user, countRefreshQuestChains]);

  ReactUse.useOnceEffect(() => {
    setTotalPoints(
      dailies
        ?.filter((d) => d.points !== null)
        ?.map((d) => d.pointsWeighted ?? 0)
        ?.reduce<number>((acc, n) => acc + n, 0),
    );
    setTotalWeight(
      dailies
        ?.filter((d) => d.points !== null)
        ?.map((d) => d.weight)
        ?.reduce<number>((acc, n) => acc + n, 0),
    );
  }, [user, dailies, date]);

  const { run: triggerRefreshDailies } = ReactUse.useThrottleFn(async (...args: unknown[]) => {
    log.info(`trigger daily list refresh${args.length > 0 ? `: ${args[0]}` : "."}`);
    setCountRefreshDailies((c) => c + 1);
  }, 2000);

  const triggerRefreshQuestChains = React.useCallback(async () => {
    log.info(`trigger quest chains refresh.`);
    setCountRefreshQuestChains((c) => c + 1);
  }, []);

  const updateDaily = React.useCallback(
    async (daily: Daily, patch: Partial<Daily>) =>
      updateDailyCallback(
        user,
        date,
        daily,
        patch,
        setDailies,
        new Set([
          "points", // recalculate streaks
          "name", // updated ids
        ]),
        new Set([
          "weight", // recalculate weighted points/total weight
          "archived", // recalculate total weight
        ]),
        triggerRefreshDailies,
        triggerRefreshQuestChains,
        setIsPatching,
      ),
    [user, date, triggerRefreshDailies, triggerRefreshQuestChains],
  );

  React.useEffect(() => {
    const insert_dailies = async (date: CalendarDate): Promise<void> => {
      await invoke("insert_dailies", {
        datetime: formatDateTimeISO8601(date.toDate(LOCAL_TZ), true),
      });
    };

    const query_dailies = async (date: CalendarDate): Promise<void> => {
      setIsLoading(true);
      await invoke<Daily[]>("query_dailies", {
        user: user.name,
        quest_id: null, // pull all dailies
        start_date: date.toString(),
        end_date: date.toString(),
      })
        .then((result) => {
          setDailies(result);
          setIsLoading(false);
        })
        .catch(console.error);
    };

    const midnightDailyRefresh = (): void => {
      const date: CalendarDate = today(LOCAL_TZ);
      insert_dailies(date);
      query_dailies(date);
      setDate(date);
    };

    const timeoutId = setTimeout(() => {
      midnightDailyRefresh();
      const intervalId = setInterval(midnightDailyRefresh, 24 * 60 * 60 * 1000);
      return () => clearInterval(intervalId);
    }, getMsToMidnight());

    return () => clearTimeout(timeoutId);
  }, [user]);

  const value: DailiesState = React.useMemo(() => {
    return {
      date,
      setDate,
      dailies,
      setDailies,
      questChains,
      setQuestChains,
      totalPoints,
      setTotalPoints,
      totalWeight,
      setTotalWeight,
      triggerRefreshDailies,
      triggerRefreshQuestChains,
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
    triggerRefreshQuestChains,
    isLoading,
    updateDaily,
  ]);

  return (
    <>
      <QuestTypesProvider>
        <DailiesContext.Provider value={value}>{props.children}</DailiesContext.Provider>
      </QuestTypesProvider>
      {isPatching && (
        <div className="absolute top-6 left-6">
          <heroui.Spinner as={"div"} className="dark z-9999" size="sm" variant="spinner" />
        </div>
      )}
    </>
  );
}

export function useDailies(): DailiesState {
  const context: Option<DailiesState> = React.useContext(DailiesContext);
  ok(context, new Error("useDailies was used outside of its Provider"));
  return context;
}

const updateDailyCallback = async (
  user: User,
  date: CalendarDate,
  daily: Daily,
  patch: Partial<Daily>,
  setDailies: React.Dispatch<React.SetStateAction<Daily[]>>,
  dailyRefreshKeys?: Option<Set<string>>,
  fullRefreshKeys?: Option<Set<string>>,
  triggerRefreshDailies: (this: unknown, ...args: unknown[]) => unknown = (..._: unknown[]) => {},
  triggerRefreshQuestChains: () => Promise<void> = async () => {},
  setIsPatching: React.Dispatch<React.SetStateAction<boolean>> = <T,>(value: T): T => value,
  isDailiesRefreshPending: Option<boolean> = false,
) => {
  setDailies((prev) =>
    prev.map((d) => {
      if (d.pointId !== daily.pointId) return d;

      const updated = { ...d, ...patch };

      // Do not updated weighted points on dailies with a streak target.
      // weighted points will be calculated with streak in dailies view.
      if (d.streakTarget !== null) return updated;

      if ("points" in patch || "weight" in patch) {
        if (updated.points !== null) {
          const complete = updated.points / updated.total;
          updated.complete = complete;
          updated.pointsWeighted = complete * updated.weight;
        } else {
          updated.complete = null;
          updated.pointsWeighted = null;
        }
      }

      return updated;
    }),
  );

  const patchKeys = Object.keys(patch);

  if (patchKeys.includes("chain")) triggerRefreshQuestChains();

  if (dailyRefreshKeys) {
    // If any of the following keys are updated, pull just this daily.
    const triggerKeys: string[] = patchKeys.filter((item) => dailyRefreshKeys.has(item));
    if (triggerKeys.length > 0) {
      setIsPatching(true);
      const query_dailies = async (): Promise<void> => {
        await invoke<Daily[]>("query_dailies", {
          user: user.name,
          quest_id: daily.questId,
          start_date: date.toString(),
          end_date: date.toString(),
        })
          .then((result) =>
            setDailies((prev) => prev.map((d) => (d.pointId === daily.pointId ? result[0] : d))),
          )
          .catch(console.error)
          .finally(() => setIsPatching(false));
      };
      query_dailies();
    }
  }

  if (fullRefreshKeys) {
    // If any of the following keys are updated, pull all dailies.
    const triggerKeysFull: string[] = patchKeys.filter((item) => fullRefreshKeys.has(item));
    if (triggerKeysFull.length > 0 && !isDailiesRefreshPending) {
      triggerRefreshDailies(`updated key(s): ${triggerKeysFull.join(", ")}`);
    }
  }
};

export { updateDailyCallback };
