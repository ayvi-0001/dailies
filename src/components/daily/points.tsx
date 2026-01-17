import * as React from "react";

import * as heroui from "@heroui/react";
import { HTMLMotionProps } from "framer-motion";
import { FlameIcon } from "lucide-react";

import * as svgs from "@/components/svgs";
import { roundTo } from "@/lib/number";
import type { Option } from "@/types/option";

import type { Daily } from "./types";

type PointsDisplayProps = {
  daily: Daily;
  points: Option<string>;
  totalWeight: number;
};

export default function PointsDisplay(props: PointsDisplayProps): React.ReactNode {
  const { daily, points: _, totalWeight } = props;

  const pointsWeighted: Option<string> = daily.pointsWeighted
    ? roundTo(daily.pointsWeighted, 2).toString()
    : null;
  const dailyPointsContribution: number = daily.pointsWeighted
    ? roundTo((daily.pointsWeighted / totalWeight) * 100, 2)
    : 0;

  const DefaultPoints = (): React.ReactElement => (
    <Tooltip content="Starting Points">
      <div className="flex flex-row items-center justify-self-end">
        <p className="text-[0.60rem] leading-none font-bold text-black empty:w-3">
          {`{${daily.defaultPoints}}`}
        </p>
      </div>
    </Tooltip>
  );

  const Weight = (): React.ReactElement => (
    <Tooltip content="Weight">
      <div className="flex flex-row items-center justify-self-end">
        <p className="text-[0.60rem] leading-none font-bold text-black empty:w-3">{daily.weight}</p>
        <svgs.Weight className="mb-[2] size-4 fill-black" />
      </div>
    </Tooltip>
  );

  const WeightedPoints = (): React.ReactElement => {
    const displayPoints: React.ReactNode =
      daily.points === null
        ? ""
        : pointsWeighted && Number.isFinite(dailyPointsContribution)
          ? `(${dailyPointsContribution}%) ${pointsWeighted}`
          : 0;

    return (
      <Tooltip content="Weighted Points">
        <div className="flex flex-row items-center">
          <p className="flex-1 justify-self-start align-middle text-[0.60rem] leading-none font-bold text-black empty:w-3">
            {displayPoints}
          </p>
          <svgs.Function className="size-4 fill-black" />
        </div>
      </Tooltip>
    );
  };

  const Streak = (): React.ReactElement => {
    return (
      <Tooltip content="Streak">
        <div className="flex flex-row items-center">
          <p className="text-[0.60rem] leading-none font-bold text-black italic empty:w-3">
            {`${daily.streak}`}
            {daily.streakTarget && `/${daily.streakTarget}`}
          </p>
          <FlameIcon className="mb-[2] ml-[2] size-3" fill="#000000" />
        </div>
      </Tooltip>
    );
  };

  function ComponentList({
    elements,
    separator,
  }: {
    elements: React.ReactElement[];
    separator: React.ReactElement;
  }): React.ReactElement[] {
    return elements.map((item, index, arr) => (
      <React.Fragment key={item.key || index}>
        {index < arr.length && index >= 1 && separator}
        {item}
      </React.Fragment>
    ));
  }

  const elements: React.ReactElement[] = [];
  if (daily.streak) elements.push(<Streak />);
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
