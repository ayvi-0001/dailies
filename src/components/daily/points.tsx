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
  points: Option<string>;
  totalWeight: number;
};

export default function PointsDisplay(props: PointsDisplayProps): React.ReactNode {
  const { daily, points: _, totalWeight } = props;

  const pointsWeighted: Option<number> = daily.pointsWeighted
    ? roundTo(daily.pointsWeighted, 2)
    : null;
  const dailyPointsContribution: number = daily.pointsWeighted
    ? roundTo((daily.pointsWeighted / totalWeight) * 100, 2)
    : 0;
  const dailyPointsMaxContribution: number = roundTo(
    (daily.weight / (daily.points === null ? totalWeight + daily.weight : totalWeight)) * 100,
    2,
  );

  const textClassValue: ClassValue = cn(
    "text-[0.60rem] leading-none font-bold",
    clsx(
      (daily.type == Quest.Type.QO && daily.points === null) || daily.points === null
        ? "opacity-50"
        : "opacity-100",
    ),
  );

  const DefaultPoints = (): React.ReactElement => (
    <Tooltip content="Starting Points">
      <div className="flex flex-row items-center justify-self-end">
        <p className={textClassValue}>{`{${daily.defaultPoints}}`}</p>
      </div>
    </Tooltip>
  );

  const Weight = (): React.ReactElement => (
    <Tooltip content="Weight">
      <div className="flex flex-row items-center">
        <span className={textClassValue}>{`(${dailyPointsMaxContribution.toFixed(2)}%)`}</span>
        <span className="mx-[2] text-xs font-bold text-gray-500">/</span>
        <span className={textClassValue}>{daily.weight.toFixed(2)}</span>
        <svgs.Weight className={cn(textClassValue, "mb-[2] size-4 fill-black")} />
      </div>
    </Tooltip>
  );

  const WeightedPoints = (): React.ReactElement => {
    return (
      <Tooltip content="Weighted Points">
        <div className="flex flex-row items-center">
          {daily.points !== null && (
            <>
              <span className={textClassValue}>
                {daily.points === null
                  ? ""
                  : pointsWeighted
                    ? `(${dailyPointsContribution.toFixed(2)}%)`
                    : `(${(0).toFixed(2)}%)`}
              </span>
              <span className="mx-[2] text-xs font-bold text-gray-500">/</span>
              <span className={textClassValue}>
                {pointsWeighted && Number.isFinite(dailyPointsContribution)
                  ? pointsWeighted.toFixed(2)
                  : `${(0).toFixed(2)}`}
              </span>
            </>
          )}
          <svgs.Function className={cn(textClassValue, "size-4 fill-black")} />
        </div>
      </Tooltip>
    );
  };

  const Streak = (): React.ReactElement => {
    const continueStreak: boolean =
      daily.streak === 0 && !!(daily.previousStreak && daily.previousStreak > 0);

    return (
      <Tooltip content="Streak">
        <div className="flex flex-row items-center">
          <p className={cn(textClassValue, "italic", clsx(continueStreak && "opacity-50"))}>
            {daily.streak || daily.previousStreak ? (
              <span>
                {daily.streak && daily.streak > 0
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

  const elements: React.ReactElement[] = [];
  if (
    (daily.streak && daily.streak > 0) ||
    daily.streakTarget ||
    (daily.previousStreak && daily.previousStreak > 0)
  )
    elements.push(<Streak />);
  elements.push(<DefaultPoints />, <Weight />);

  return (
    <div className="mt-[1.0] flex-col items-center justify-self-end">
      <div className="flex flex-row items-center gap-[2] justify-self-end align-middle">
        <ComponentList
          elements={elements}
          separator={<p className="ml-[1] text-xs font-bold text-gray-500">/</p>}
        />
      </div>
      <div className="py-[1.0]" />
      <div className="flex flex-row justify-self-end align-middle">
        <WeightedPoints />
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
