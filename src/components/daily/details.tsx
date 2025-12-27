import * as React from "react";

import { Chip } from "@heroui/react";
import { Divider } from "@heroui/react";

import { Weekdays } from "@/lib/dates";
import type { Option } from "@/types/option";

import { QuestType, QuestTypeStyles } from "./providers/quest-types";
import type { Daily } from "./types";

type DetailsProps = {
  daily: Daily;
  questType: Option<QuestType>;
  questTypeStyles: QuestTypeStyles;
};

export default function Details(props: DetailsProps): React.ReactElement {
  const { daily, questType, questTypeStyles } = props;

  const elements: React.ReactElement[] = [];

  addType();
  addRequirements();
  addTimeDetails();
  addWeekdayDetails();

  return (
    <div className="flex w-full flex-row items-center gap-2">
      <div className="scrollbar-hide flex h-full flex-row gap-1 overflow-auto py-1 font-mono text-ellipsis">
        <ComponentList
          elements={elements}
          separator={<Divider className="h-full" orientation="vertical" />}
        />
      </div>
    </div>
  );

  function ComponentList({
    elements,
    separator,
  }: {
    elements: React.ReactElement[];
    separator: React.ReactElement;
  }): React.ReactElement {
    return (
      <>
        {elements.map((item, index, arr) => (
          <React.Fragment key={item.key || index}>
            {index < arr.length && index >= 1 && separator}
            {item}
          </React.Fragment>
        ))}
      </>
    );
  }

  function addType(): void {
    elements.push(
      <Chip
        as={"p"}
        className="h-fit px-0 text-[0.55rem] leading-none tracking-tighter"
        classNames={{
          base: questTypeStyles.typeBadgeClass as string,
          content: "font-semibold drop-shadow-xs shadow-black",
        }}
        size="sm"
      >
        {questType?.name}
      </Chip>,
    );
  }

  function addRequirements(): void {
    const requirements: Option<string> =
      daily.requirements !== null ? `${daily.requirements}` : null;

    if (requirements) {
      elements.push(
        <div key={elements.length + 1} className="empty:h-6">
          <p className="text-[0.55rem] leading-none font-bold tracking-tighter text-nowrap text-ellipsis">
            R:{requirements}
          </p>
        </div>,
      );
    }
  }

  function addTimeDetails(): void {
    const timeDetail: Option<string> =
      daily.timeStart !== null && daily.timeEnd !== null
        ? `${daily.timeStart.slice(0, 5)} ~ ${daily.timeEnd.slice(0, 5)}`
        : null;

    if (timeDetail) {
      elements.push(
        <div key={elements.length + 1} className="empty:h-6">
          <p className="text-[0.55rem] leading-none font-bold tracking-tighter text-nowrap text-ellipsis">
            {timeDetail}
          </p>
        </div>,
      );
    }
  }

  function addWeekdayDetails(): void {
    const days = [];
    if (daily.days) {
      for (const day of daily.days) {
        days.push(Weekdays[day]);
      }
    }

    if (days) {
      elements.push(
        <div key={elements.length + 1} className="empty:h-6">
          <p className="text-[0.55rem] leading-none font-bold tracking-tighter text-nowrap text-ellipsis">
            {days.join("/")}
          </p>
        </div>,
      );
    }
  }
}
