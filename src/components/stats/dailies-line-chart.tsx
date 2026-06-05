"use client";

import * as React from "react";

import * as heroui from "@heroui/react";
import * as ReactUse from "@reactuses/core";
import * as log from "@tauri-apps/plugin-log";
import * as reaviz from "reaviz";
import { CalendarDate, parseDate, today } from "@internationalized/date";
import clsx from "clsx";
import { CalendarCogIcon } from "lucide-react";
import { Result, ResultAsync } from "neverthrow";

import { type User, useUser } from "@/app/providers/user";
import { DailiesState, useDailies } from "@/components/daily/providers/dailies";
import { LOCAL_TZ } from "@/lib/dates";
import { invoke } from "@/lib/tauri";
import { Option } from "@/types/option";
import { UseBoolean } from "@/types/props";

export default function DailiesLineChart(): React.ReactElement {
  const todayDate: CalendarDate = today(LOCAL_TZ);
  const dailiesState: DailiesState = useDailies();

  const user: Result<User, Error> = useUser();
  const userName: Option<string> = user.map((t) => t.name).unwrapOr(null);

  const [dateRange, setDateRange] = React.useState<heroui.RangeValue<CalendarDate>>({
    start: todayDate.subtract({ days: 6 }),
    end: todayDate,
  });

  const [data, setData] = React.useState<reaviz.ChartNestedDataShape[]>([]);
  const [selectedChains, setSelectedChains] = React.useState<heroui.Selection>("all");
  const loading: UseBoolean = ReactUse.useBoolean();

  ReactUse.useOnceEffect(() => {
    loading.setTrue();
    ResultAsync.fromPromise(
      invoke<{ [key: string]: QuestChainsCompleteDataPoint[] }>("query_quest_chains_complete", {
        user: userName,
        start_date: dateRange.start.toString(),
        end_date: dateRange.end.toString(),
      }),
      (e) => log.error(`${e}`),
    )
      .andTee((t) =>
        setData(
          Object.keys(t).map((v: string) => ({
            key: v,
            id: v,
            data: t[v].map((p: QuestChainsCompleteDataPoint) => ({
              key: parseDate(p.date).toDate(LOCAL_TZ),
              data: p.value,
            })),
          })),
        ),
      )
      .then(() => loading.setFalse());
  }, [userName, dateRange, dailiesState.dailies]);

  const chains: string[] = React.useMemo(
    () => dailiesState.questChains.sort((v) => v.sequence).map((v) => v.chain),
    [dailiesState.questChains],
  );

  const filteredData = React.useMemo<reaviz.ChartNestedDataShape[]>(() => {
    if (selectedChains === "all") return data;
    const selected = selectedChains as Set<React.Key>;
    if (selected.size === 0) return data;
    return data.filter((d) => selected.has(d.key as string));
  }, [data, selectedChains]);

  const legendEntries = React.useMemo<Array<{ label: string; color: string }>>(() => {
    if (filteredData.length === 0) return [];
    const aggregated = reaviz.buildNestedChartData(filteredData, true);
    return aggregated.map((series, index: number) => {
      const innerKey = series.data[0]?.key as unknown;
      const color = reaviz.getColor({
        data: aggregated,
        colorScheme: "Set2",
        point: series.data,
        index,
        key: innerKey,
      }) as string;
      return { label: String(series.key), color };
    });
  }, [filteredData]);

  const datePickerClassNames = React.useMemo(
    () => ({
      inputWrapper: "w-fit",
      segment:
        "text-xs font-bold text-[#f0f0ff] transition-colors data-[editable=true]:text-[#f0f0ff] data-[editable=true]:focus:text-[#f0f0ff] data-[editable=true]:data-[placeholder=true]:text-[#f0f0ff]",
      calendarContent: "dark text-xs",
      popoverContent: "dark",
      separator: "text-[#f0f0ff]",
    }),
    [],
  );

  return (
    <div className="mx-5 h-80">
      <div className="mb-5 flex flex-row items-center text-sm">
        <div className="mb-5 flex flex-col items-center text-sm">
          <p className="self-center text-xs font-bold text-[#f0f0ff]">Date Range</p>
          <heroui.DateRangePicker
            aria-label="line chart date range picker"
            className="dark mt-1 mb-2 w-fit text-xs"
            classNames={datePickerClassNames}
            maxValue={todayDate}
            selectorIcon={<CalendarCogIcon size={18} stroke="#f0f0ff" />}
            value={dateRange}
            onChange={(v) => setDateRange((prev) => v ?? prev)}
          />
          <p className="self-center text-xs font-bold text-[#f0f0ff]">Quest Chains</p>
          <heroui.Select
            isClearable
            aria-label="quest chain filter"
            className="dark mt-1 mb-2 w-64 text-xs text-[#f0f0ff]"
            classNames={{
              popoverContent: "dark",
              innerWrapper: "text-xs",
              listbox: " text-xs text-[#f0f0ff]",
              listboxWrapper: "dark text-xs",
            }}
            isDisabled={chains.length === 0}
            placeholder="All chains"
            selectedKeys={selectedChains}
            selectionMode="multiple"
            size="sm"
            onClear={() => setSelectedChains(new Set([]))}
            onSelectionChange={setSelectedChains}
          >
            {chains.map((c: string) => (
              <heroui.SelectItem key={c}>{c}</heroui.SelectItem>
            ))}
          </heroui.Select>
        </div>
        {legendEntries.length > 0 && (
          <reaviz.DiscreteLegend
            className="dark flex w-full flex-wrap justify-end text-xs text-[#f0f0ff]"
            entries={legendEntries.map((e) => (
              <reaviz.DiscreteLegendEntry
                key={e.label}
                color={e.color}
                label={e.label}
                orientation="vertical"
              />
            ))}
            orientation="horizontal"
          />
        )}
      </div>
      <heroui.Skeleton
        className={clsx(loading.value && "dark rounded-2xl opacity-30")}
        isLoaded={!loading.value}
      >
        {filteredData.length === 0 ? (
          <div className="flex h-80 w-full place-items-center justify-center opacity-30">
            <p className="text-sm text-[#f0f0ff] italic">No data for the selected filters</p>
          </div>
        ) : (
          <div className="mr-3">
            <reaviz.LineChart
              className="flex"
              data={filteredData}
              height={250}
              margins={[5, 5]}
              series={
                <reaviz.LineSeries
                  colorScheme="Set2"
                  line={<reaviz.Line strokeWidth={2} />}
                  tooltip={
                    <reaviz.TooltipArea
                      tooltip={
                        <reaviz.ChartTooltip
                          content={(
                            series: reaviz.ChartDataTypes,
                            color: (d: unknown) => string,
                          ) => {
                            if (!series) return null;
                            const value = series as unknown as {
                              x: Date | string;
                              data:
                                | Array<{ key?: string; x?: Date; value: number; y?: number }>
                                | { value?: number; y?: number };
                            };
                            const formatPct = (v: number) => `${(v * 100).toFixed(0)}%`;
                            const reshaped = Array.isArray(value.data)
                              ? {
                                  ...value,
                                  data: value.data.map((d) => ({
                                    ...d,
                                    value: formatPct(d.value ?? d.y ?? 0) as unknown as number,
                                  })),
                                }
                              : {
                                  ...value,
                                  value: formatPct(value.data.value ?? value.data.y ?? 0),
                                };
                            return (
                              <reaviz.TooltipTemplate
                                color={color}
                                value={reshaped as unknown as undefined}
                              />
                            );
                          }}
                          followCursor={true}
                        />
                      }
                    />
                  }
                  type="grouped"
                />
              }
              xAxis={
                <reaviz.LinearXAxis
                  tickSeries={
                    <reaviz.LinearXAxisTickSeries
                      label={
                        <reaviz.LinearXAxisTickLabel
                          format={(v: Date | number) =>
                            new Date(v).toLocaleDateString("default", {
                              month: "short",
                              day: "2-digit",
                            })
                          }
                        />
                      }
                    />
                  }
                  type="time"
                />
              }
              yAxis={
                <reaviz.LinearYAxis
                  domain={[0, 1]}
                  tickSeries={
                    <reaviz.LinearYAxisTickSeries
                      label={
                        <reaviz.LinearYAxisTickLabel
                          format={(v: number) => `${(v * 100).toFixed(0)}%`}
                        />
                      }
                    />
                  }
                  type="value"
                />
              }
            />
          </div>
        )}
      </heroui.Skeleton>
    </div>
  );
}

type QuestChainsCompleteDataPoint = {
  date: string;
  chain: string;
  value: number;
};
