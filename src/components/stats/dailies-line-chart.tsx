"use client";

import * as React from "react";

import * as heroui from "@heroui/react";
import * as ReactUse from "@reactuses/core";
import * as reaviz from "reaviz";
import { Skeleton } from "@heroui/skeleton";
import { now, parseDate } from "@internationalized/date";
import { Result } from "neverthrow";

import { type User, useUser } from "@/app/providers/user";
import { LOCAL_TZ } from "@/lib/dates";
import { invoke } from "@/lib/tauri";
import { Option } from "@/types/option";

export default function DailiesLineChart(): React.ReactElement {
  // TODO(ayvi): add date filters
  const start_date: string = now(LOCAL_TZ).subtract({ days: 90 }).toString().substring(0, 10);
  const end_date: string = now(LOCAL_TZ).toString().substring(0, 10);

  const user: Result<User, Error> = useUser();
  const userName: Option<string> = user.map((t) => t.name).unwrapOr(null);

  const [data, setData] = React.useState<reaviz.ChartNestedDataShape[]>([]);
  ReactUse.useOnceEffect(() => {
    const query_quest_chains_complete = async (): Promise<void> => {
      await invoke<{ [key: string]: QuestChainsCompleteDataPoint[] }>(
        "query_quest_chains_complete",
        {
          user: userName,
          start_date: start_date,
          end_date: end_date,
        },
      )
        .then((result: { [key: string]: QuestChainsCompleteDataPoint[] }) =>
          setData(
            Object.keys(result).map((v: string) => {
              const data = result[v].map((v: QuestChainsCompleteDataPoint) => {
                return {
                  key: parseDate(v.date).toDate(LOCAL_TZ),
                  data: v.value,
                };
              });
              return {
                key: v,
                id: v,
                data: data,
              };
            }),
          ),
        )
        .catch(console.error);
    };
    query_quest_chains_complete();
  }, [userName]);

  return data.length > 0 ? (
    <div className="m-5">
      <heroui.ScrollShadow
        hideScrollBar
        className="flex w-full flex-row-reverse"
        offset={50}
        orientation="horizontal"
        size={10}
        visibility="both"
      >
        <div className="flex size-fit flex-row select-none">
          <reaviz.LineChart
            data={data}
            height={280}
            margins={[5, 5]}
            series={
              <reaviz.LineSeries
                colorScheme="Set2"
                line={<reaviz.Line strokeWidth={2} />}
                type="grouped"
              />
            }
            width={1850}
          />
        </div>
      </heroui.ScrollShadow>
    </div>
  ) : (
    <div className="flex size-full cursor-wait place-items-center opacity-50">
      <Skeleton className="dark m-5 size-full rounded-2xl" />
    </div>
  );
}

type QuestChainsCompleteDataPoint = {
  date: string;
  chain: string;
  value: number;
};
