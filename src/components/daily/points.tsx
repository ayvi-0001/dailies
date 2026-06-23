import * as React from "react";

import * as heroui from "@heroui/react";
import clsx, { ClassValue } from "clsx";
import { HTMLMotionProps } from "framer-motion";
import { FlameIcon } from "lucide-react";

import * as svgs from "@/components/svgs";
import ComponentList from "@/components/ui/list";
import { roundTo } from "@/lib/number";
import { cn } from "@/lib/utils";
import type { Option } from "@/types/option";

import { type Daily, Quest } from "./types";

type PointsDisplayProps = {
  daily: Daily;
  totalWeight: number;
};

export default function PointsDisplay(props: PointsDisplayProps): React.ReactNode {
  const { daily, totalWeight } = props;

  const textClassValue: ClassValue = React.useMemo(
    () =>
      cn(
        "text-[0.60rem] leading-none font-bold",
        clsx(
          (daily.type == Quest.Type.QO && daily.points === null) || daily.points === null
            ? "opacity-50"
            : "opacity-100",
        ),
      ),
    [daily.type, daily.points],
  );

  const elements: React.ReactElement[] = [];
  if (+`${daily.streak}` > 0 || daily.streakTarget || +`${daily.previousStreak}` > 0)
    elements.push(<Streak daily={daily} textClassValue={textClassValue} />);

  elements.push(<DefaultPoints key={1} daily={daily} textClassValue={textClassValue} />);

  const dailyPointsMaxContribution: number = React.useMemo(
    () =>
      roundTo(
        (daily.weight / (daily.points === null ? totalWeight + daily.weight : totalWeight)) * 100,
        2,
      ),
    [daily.weight, daily.points, totalWeight],
  );
  const dailyPointsContribution: number = React.useMemo(
    () => (daily.pointsWeighted ? roundTo((daily.pointsWeighted / totalWeight) * 100, 2) : 0),
    [daily.pointsWeighted, totalWeight],
  );

  return (
    <div className="flex flex-col place-items-end justify-between">
      <Weight
        daily={daily}
        dailyPointsMaxContribution={dailyPointsMaxContribution}
        textClassValue={textClassValue}
      />
      <WeightedPoints
        daily={daily}
        dailyPointsContribution={dailyPointsContribution}
        pointsWeighted={daily.pointsWeighted ? roundTo(daily.pointsWeighted, 2) : null}
        textClassValue={textClassValue}
      />
      <div className="flex min-h-4 flex-row items-center gap-1">
        <ComponentList elements={elements} />
      </div>
    </div>
  );
}

function Tooltip({
  content,
  children,
}: {
  content: React.ReactNode;
  children: React.ReactNode;
}): React.ReactElement {
  const motionProps: Omit<HTMLMotionProps<"div">, "ref"> = {
    variants: {
      exit: { opacity: 0, transition: { duration: 0.1, ease: "easeIn" } },
      enter: { opacity: 1, transition: { duration: 0.15, ease: "easeOut" } },
    },
  };

  return (
    <heroui.Tooltip
      classNames={{ base: "dark", content: "text-xs text-white" }}
      closeDelay={0}
      content={content}
      delay={1000}
      motionProps={motionProps}
      offset={3}
      showArrow={true}
    >
      {children}
    </heroui.Tooltip>
  );
}

const DefaultPoints = ({
  daily,
  textClassValue,
}: {
  daily: Daily;
  textClassValue?: ClassValue;
}): React.ReactElement => (
  <Tooltip content="Default Points">
    <p className={textClassValue as string}>{`{${daily.defaultPoints}}`}</p>
  </Tooltip>
);

const Weight = ({
  daily,
  textClassValue,
  dailyPointsMaxContribution,
}: {
  daily: Daily;
  textClassValue?: ClassValue;
  dailyPointsMaxContribution: number;
}): React.ReactElement => {
  const value = `(${dailyPointsMaxContribution.toFixed(2)}%)`;

  return (
    <Tooltip content="Weight">
      <div className="flex flex-row items-center">
        <ComponentList
          elements={[
            <span key={1} className={textClassValue as string}>
              {value}
            </span>,
            <span key={2} className={textClassValue as string}>
              {daily.weight.toFixed(2)}
            </span>,
          ]}
          separator={<p className="mx-[2] text-xs font-bold text-gray-500">/</p>}
        />
        <svgs.Weight key={3} className={cn(textClassValue, "mb-[2] size-4 fill-black")} />
      </div>
    </Tooltip>
  );
};

const WeightedPoints = ({
  daily,
  dailyPointsContribution,
  pointsWeighted,
  textClassValue,
}: {
  daily: Daily;
  dailyPointsContribution: number;
  pointsWeighted: Option<number>;
  textClassValue?: ClassValue;
}): React.ReactElement => {
  const pointsValue =
    daily.points === null
      ? ""
      : pointsWeighted
        ? `(${dailyPointsContribution.toFixed(2)}%)`
        : `(${(0).toFixed(2)}%)`;
  const weightedValue =
    pointsWeighted && Number.isFinite(dailyPointsContribution)
      ? pointsWeighted.toFixed(2)
      : `${(0).toFixed(2)}`;

  return (
    <Tooltip content="Weighted Points">
      <div className="flex flex-row items-center">
        {daily.points !== null && (
          <>
            <ComponentList
              elements={[
                <span key={1} className={textClassValue as string}>
                  {pointsValue}
                </span>,
                <span key={2} className={textClassValue as string}>
                  {weightedValue}
                </span>,
              ]}
              separator={<p className="mx-[2] text-xs font-bold text-gray-500">/</p>}
            />
          </>
        )}
        <svgs.Function className={cn(textClassValue as string, "size-4 fill-black")} />
      </div>
    </Tooltip>
  );
};

const Streak = ({
  daily,
  textClassValue,
}: {
  daily: Daily;
  textClassValue?: ClassValue;
}): React.ReactElement => {
  const continueStreak: boolean = daily.streak === 0 && !!(+`${daily.previousStreak}` > 0);

  return (
    <Tooltip content="Streak">
      <div className="flex flex-row items-center">
        <p className={cn(textClassValue, "italic", clsx(continueStreak && "opacity-50"))}>
          {daily.streak || daily.previousStreak ? (
            <span>
              {+`${daily.streak}` > 0
                ? daily.streak
                : daily.previousStreak
                  ? daily.previousStreak + 1
                  : ""}
            </span>
          ) : (
            <span className="text-black/50">{daily.previousStreak}</span>
          )}
          <span>{daily.streakTarget && `/${daily.streakTarget}`}</span>
        </p>
        <FlameIcon
          className={cn("mb-[2] ml-[2] size-3", clsx(continueStreak && "opacity-50"))}
          fill="#000000"
        />
      </div>
    </Tooltip>
  );
};
