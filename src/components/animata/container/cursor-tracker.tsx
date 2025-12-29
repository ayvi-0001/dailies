"use client";

import * as React from "react";

import clsx from "clsx";

import useMousePosition, { Coordinates } from "@/hooks/use-mouse-position";
import { cn } from "@/lib/utils";
import { Option } from "@/types/option";

type CursorTrackerProps = {
  platform?: Option<string>;
  children: React.ReactNode[];
};

/**
 * @component @name CursorTracker
 * @description A wrapper component that tracks the cursor moving within it.
 * The first child component will be used as the cursor.
 *
 * @see https://animata.design/docs/container/cursor-tracker
 */
export default function CursorTracker(props: CursorTrackerProps): React.JSX.Element {
  const { platform, children } = props;

  const [isTouched, setIsTouched] = React.useState<boolean>(false);

  const handleTouchStart = () => setIsTouched(true);
  const handleTouchEnd = () => setIsTouched(false);

  const cursor = children.at(0);
  const components = children.slice(1);

  const divRef = React.useRef<Option<HTMLDivElement>>(null);
  const infoRef = React.useRef<Option<HTMLDivElement>>(null);

  const update = React.useCallback(
    ({ x, y }: Coordinates) => {
      // We need to offset the position to center the info div
      const offsetX = (infoRef?.current?.offsetWidth || 0) / 2;
      const offsetY = (infoRef?.current?.offsetHeight || 0) / 2;

      // Use CSS variables to position the info div instead of state to avoid re-renders
      infoRef?.current?.style.setProperty("--x", `${x - offsetX}px`);
      infoRef?.current?.style.setProperty("--y", `${y - offsetY}px`);
    },
    [infoRef],
  );

  useMousePosition(divRef, update);

  return (
    <div
      ref={divRef}
      className="group relative cursor-none"
      onContextMenu={(event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        event.preventDefault();
      }}
    >
      {components}
      {/* Cursor tracker */}
      <div
        ref={infoRef}
        className={cn(
          "absolute top-0 left-0 opacity-0 duration-0 group-hover:opacity-100",
          clsx(isTouched && "opacity-100"),
          clsx(platform == "android" && "touch-none"),
          clsx(platform == "windows" && "pointer-events-none"),
        )}
        style={{ transform: "translate(var(--x), var(--y))" }}
        onTouchEnd={handleTouchEnd}
        onTouchStart={handleTouchStart}
      >
        {cursor}
      </div>
    </div>
  );
}
