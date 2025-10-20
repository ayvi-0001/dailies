"use client";

import * as React from "react";

import { invoke } from "@tauri-apps/api/core";

import * as User from "@/app/providers/user";
import * as WindowSize from "@/app/providers/window-size";
import type { Option } from "@/types/option";

import DailyCard from "./card";
import QuestsHeader from "./header";
import type { Daily } from "./types";

export default function DailyList({ title }: { title: string }): React.ReactNode {
  const [dailies, setDailies] = React.useState<Daily[]>([]);
  const [totalPoints, setTotalPoints] = React.useState<number>(0);
  const [totalWeight, setTotalWeight] = React.useState<number>(0);
  const [countRefreshDailies, setCountRefreshDailies] = React.useState<number>(0);

  const windowSize: WindowSize.WindowWidthState = WindowSize.useWidth();

  const triggerRefreshDailies: () => void = React.useCallback(() => {
    setCountRefreshDailies(countRefreshDailies + 1);
  }, [countRefreshDailies]);

  const userState: User.UserState = User.useState();
  const userName: Option<string> = userState?.user?.name || null;

  React.useEffect(() => {
    const query_dailies = async (): Promise<void> => {
      await invoke<Daily[]>("query_dailies", {
        user: userName,
        quest_id: null, // pull all dailies
        // TODO(ayvi): pulling fixed date for dev
        start_date: "2025-10-03",
        end_date: "2025-10-03",
      })
        .then(result => setDailies(result))
        .catch(console.error);
    };
    query_dailies();

    const get_total_points = async (): Promise<void> => {
      await invoke<{
        total_points: number;
        total_weight: number;
      }>("get_total_points", {
        user: userName,
        date: "2025-10-03",
      })
        .then(result => {
          setTotalWeight(result.total_weight);
          setTotalPoints(result.total_points);
        })
        .catch(console.error);
    };
    get_total_points();
  }, [userName, countRefreshDailies]);

  return (
    <div className="absolute sm:m-5 sm:w-[calc(100%-40px)] lg:m-20 lg:w-[calc(100%-160px)]">
      <div className="flex flex-col overflow-hidden">
        <div className="mb-3 grow md:mb-4 lg:mb-5">
          <QuestsHeader
            title={`${title}`}
            totalWeight={totalWeight}
            totalPoints={totalPoints}
            countRefreshDailies={countRefreshDailies}
          />
        </div>
        <div className="grid gap-3 md:gap-4 lg:gap-5">
          {dailies.map((value, index) => (
            <DailyCard
              key={index}
              daily={value}
              totalWeight={totalWeight}
              windowWidth={windowSize.windowWidth}
              onRefreshAction={triggerRefreshDailies}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
