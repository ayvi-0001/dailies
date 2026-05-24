"use client;";

import * as React from "react";

import * as heroui from "@heroui/react";
import { Chip } from "@heroui/react";
import { Divider } from "@heroui/react";
import { CalendarDate, parseDate, today } from "@internationalized/date";
import { ClassValue } from "clsx";
import { HTMLMotionProps } from "framer-motion";

import ComponentList from "@/components/ui/list";
import { DaysOfWeek, LOCAL_TZ, isEveryDay, isWeekDay, isWeekend } from "@/lib/dates";
import { invoke } from "@/lib/tauri";
import { cn } from "@/lib/utils";
import type { Option } from "@/types/option";

import { QuestType, QuestTypeStyles } from "./providers/quest-types";
import { type Daily, Quest } from "./types";

type DetailsProps = {
  daily: Daily;
  descriptionContent?: "description" | "note";
  questType: Option<QuestType>;
  questTypeStyles: QuestTypeStyles;
};

type WeeklyQuestStats = {
  date: string;
  questId: string;
  pointId: string;
  requirements: number;
  latestCompleteDate: Option<string>;
  rollingPoints: number;
  isWeeklyRequirementComplete: boolean;
};

export default function Details(props: DetailsProps): React.ReactElement {
  const { daily, descriptionContent, questType, questTypeStyles } = props;

  const textClassValue: ClassValue =
    "text-[0.55rem] leading-none tracking-tighter text-nowrap text-ellipsis";

  const [weeklyQuestStats, setWeeklyQuestStats] = React.useState<Option<WeeklyQuestStats>>(null);
  const nextRequiredCompletionDate = React.useRef<Option<CalendarDate>>(null);

  React.useEffect(() => {
    if (daily.type == Quest.Type.QWM && daily.archived == null) {
      const get_weekly_max_type_stats = async (): Promise<void> => {
        await invoke<WeeklyQuestStats>("get_weekly_max_type_stats", {
          quest_id: daily.questId,
          requirements: +`${daily.requirements}`,
          date: daily.date,
        })
          .then((result) => {
            setWeeklyQuestStats(result);
            // TODO(ayvi): calculate next required completion date for type `q-w-m` http://ayvi:3000/ayvi/dailies/issues/172
            if (
              daily.date == today(LOCAL_TZ).toString() &&
              daily.type == Quest.Type.QWM &&
              result?.isWeeklyRequirementComplete
            )
              nextRequiredCompletionDate.current = parseDate(result.latestCompleteDate!).add({
                days: +`${daily.requirements}`,
              });
          })
          .catch(console.error);
      };
      get_weekly_max_type_stats();
    } else if (daily.type == Quest.Type.QWS && daily.archived == null) {
      const get_weekly_sum_type_stats = async (): Promise<void> => {
        await invoke<WeeklyQuestStats>("get_weekly_sum_type_stats", {
          quest_id: daily.questId,
          requirements: +`${daily.requirements}`,
          date: daily.date,
        })
          .then((result) => setWeeklyQuestStats(result))
          .catch(console.error);
      };
      get_weekly_sum_type_stats();
    }
  }, [daily.date, daily.questId, daily.requirements, daily.type, daily.archived, daily.points]);

  const description = React.useRef<React.ReactElement>(<> </>);

  let text: React.ReactNode = null;
  if (weeklyQuestStats)
    text = (
      <span>
        {nextRequiredCompletionDate.current && (
          <>
            <span>Next req. date: {`${nextRequiredCompletionDate.current} `}</span>
            <br></br>
          </>
        )}
        <span>Last completed: {`${weeklyQuestStats?.latestCompleteDate} `}</span>
        <br></br>
        <span>Weekly points: {`${weeklyQuestStats?.rollingPoints} `}</span>
      </span>
    );
  else text = descriptionContent == "note" ? daily.note : daily.description;

  description.current = (
    <PopoverText
      maxLines={2}
      popoverContentProps={{ className: "rounded-none border-1 border-white bg-black/60" }}
      popoverTextProps={{ className: "text-xs text-white" }}
      text={text}
      textClassValue={cn("pt-[2] text-[0.60rem]", textClassValue)}
    />
  );

  const elements: React.ReactElement[] = [];

  addType(elements, questType, questTypeStyles, textClassValue);
  addRequirements(elements, daily, weeklyQuestStats, textClassValue);
  addTimeWindow(elements, daily, textClassValue);
  addDaysOfWeek(elements, daily, textClassValue);

  return (
    <>
      <div className="flex w-full flex-row items-center gap-2">
        <div className="scrollbar-hide flex h-full w-fit flex-row gap-1 overflow-auto py-[3] font-mono text-ellipsis">
          <ComponentList
            elements={elements}
            separator={<Divider className="h-full" orientation="vertical" />}
          />
        </div>
      </div>
      <heroui.Divider />
      {description.current}
    </>
  );
}

function addType(
  elements: React.ReactElement[],
  questType: Option<QuestType>,
  questTypeStyles: QuestTypeStyles,
  textClassValue: ClassValue,
): void {
  elements.push(
    <Chip
      as={"p"}
      classNames={{
        base: cn(questTypeStyles.typeBadgeClass as string, "h-3"),
        content: cn("font-semibold drop-shadow-xs shadow-black px-0", textClassValue),
      }}
      size="sm"
    >
      {questType?.name}
    </Chip>,
  );
}

function addRequirements(
  elements: React.ReactElement[],
  daily: Daily,
  weeklyQuestStats: Option<WeeklyQuestStats>,
  textClassValue: ClassValue,
): void {
  if (weeklyQuestStats) {
    elements.push(
      <div key={elements.length + 1} className="flex place-items-center">
        <span className={cn(textClassValue, "font-bold")}>R={`${daily.requirements}`}</span>
      </div>,
    );

    if (!!weeklyQuestStats.isWeeklyRequirementComplete)
      elements.push(
        <div key={elements.length + 1} className="flex place-items-center">
          <span className={cn(textClassValue, "text-green-600", "font-bold")}>✓</span>
        </div>,
      );
    else
      elements.push(
        <div key={elements.length + 1} className="flex place-items-center">
          <span className={cn(textClassValue, "text-red-600", "font-bold")}>✗</span>
        </div>,
      );
  }
}

function addTimeWindow(
  elements: React.ReactElement[],
  daily: Daily,
  textClassValue: ClassValue,
): void {
  if (![Quest.Type.QR, Quest.Type.QW].includes(daily.type)) return;
  else if (daily.timeStart && daily.timeEnd)
    elements.push(
      <div key={elements.length + 1} className="flex place-items-center empty:h-6">
        <p
          className={cn(textClassValue, "font-bold")}
        >{`${daily.timeStart.slice(0, 5)} ~ ${daily.timeEnd.slice(0, 5)}`}</p>
      </div>,
    );
}

function addDaysOfWeek(
  elements: React.ReactElement[],
  daily: Daily,
  textClassValue: ClassValue,
): void {
  const days = [];

  if (![Quest.Type.QR, Quest.Type.QW].includes(daily.type)) return;
  if (daily.days)
    if (isEveryDay(daily.days)) days.push("Everyday");
    else if (isWeekDay(daily.days)) days.push("Weekdays");
    else if (isWeekend(daily.days)) days.push("Weekends");
    else
      for (const day of daily.days) {
        days.push(DaysOfWeek[day]);
      }

  if (days.length > 0)
    elements.push(
      <div key={elements.length + 1} className="flex place-items-center empty:h-6">
        <p className={cn(textClassValue, "font-bold")}>{days.join("/").replace(/\/+$/, "")}</p>
      </div>,
    );
}

type PopoverTextProps = {
  maxLines: number;
  popoverContentProps?: heroui.PopoverContentProps;
  popoverTextProps?: React.ComponentProps<"div">;
  text: React.ReactNode;
  textClassValue?: ClassValue;
};

export function PopoverText(props: PopoverTextProps): React.ReactElement {
  const { maxLines, popoverContentProps, popoverTextProps, text, textClassValue } = props;

  const motionProps: Omit<HTMLMotionProps<"div">, "ref"> = {
    variants: {
      exit: { opacity: 0, transition: { duration: 0.1, ease: "easeIn" } },
      enter: { opacity: 1, transition: { duration: 0.15, ease: "easeOut" } },
    },
  };

  return (
    <heroui.Popover motionProps={motionProps} placement="bottom-start">
      <heroui.PopoverTrigger className="wrap-break-word">
        <p
          className={cn(
            `line-clamp-${maxLines}`,
            "overflow-hidden wrap-break-word text-ellipsis",
            textClassValue,
          )}
        >
          {text}
        </p>
      </heroui.PopoverTrigger>
      <heroui.PopoverContent
        {...popoverContentProps}
        className={cn(
          "flex rounded-sm bg-transparent shadow-none outline-none select-none",
          popoverContentProps?.className,
        )}
      >
        <p {...popoverTextProps}>{text}</p>
      </heroui.PopoverContent>
    </heroui.Popover>
  );
}
