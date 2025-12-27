import * as React from "react";

import { cn } from "@/lib/utils";

interface ProgressProps<T> {
  progress: number;
  deps?: { [Symbol.iterator](): Iterator<T> };
}

export default function Progress<T>(props: ProgressProps<T>): React.ReactElement {
  const { progress, ...deps } = props;
  const [width, setWidth] = React.useState(0);

  const barWidth = 2;
  const gap = 2;

  const bars = Math.floor(width / (barWidth + gap));
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setWidth(containerRef.current?.offsetWidth ?? 0);
  }, [deps]);

  const [shouldUseValue, setShouldUseValue] = React.useState(false);

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      // This is a hack to force the animation to run for the first time.
      // We can use framer-motion to achieve this but just keeping it simple for now.
      setShouldUseValue(true);
    }, 250);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative flex h-4 w-full min-w-4 flex-wrap gap-[2px] overflow-hidden"
    >
      {Array.from(Array(bars)).map((_, index) => {
        const highlight = shouldUseValue ? index / bars < progress / 100 : 0;
        return (
          <div
            key={`bar_${index}`}
            className={cn("h-full w-[2px] rounded-[1px] transition-all", {
              "bg-green-600 duration-75 group-hover:rounded group-hover:bg-zinc-50 group-active:rounded group-active:bg-zinc-50":
                highlight,
              "bg-[#404445] duration-300 group-hover:scale-75 group-hover:bg-zinc-900/15 group-active:scale-75 group-active:bg-zinc-900/15":
                !highlight,
            })}
            style={{
              transitionDelay: highlight ? `${index * 5}ms` : "0ms",
            }}
          />
        );
      })}
    </div>
  );
}
