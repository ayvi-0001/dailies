import * as React from "react";

import { cn } from "@/lib/utils";

interface DonutChartProps {
  size: number;
  progress: number;
  trackClassName?: string;
  progressClassName?: string;
  circleWidth?: number;
  progressWidth?: number;
  rounded?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export default function DonutChart({
  size,
  progress,
  progressClassName = "text-green-500",
  trackClassName = "text-black/10 dark:text-white/10",
  circleWidth = 16,
  progressWidth = 16,
  rounded = true,
  className,
  children,
}: DonutChartProps) {
  const [shouldUseValue, setShouldUseValue] = React.useState(false);

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      // This is a hack to force the animation to run for the first time.
      // We can use framer-motion to achieve this but just keeping it simple for now.
      setShouldUseValue(true);
    }, 250);
    return () => clearTimeout(timeout);
  }, []);

  const radius = size / 2 - Math.max(progressWidth, circleWidth) / 2;
  const circumference = Math.PI * radius * 2;
  const percentage = shouldUseValue ? circumference * ((100 - progress) / 100) : circumference;

  return (
    <div className={className}>
      <svg
        height={size}
        style={{ transform: "rotate(-90deg)" }}
        version="1.1"
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          className={cn("duration-500", trackClassName)}
          cx={size / 2}
          cy={size / 2}
          fill="transparent"
          r={radius}
          stroke="currentColor"
          strokeDasharray={"10px 0"}
          strokeDashoffset="0px"
          strokeWidth={`${circleWidth}px`}
        />
        <circle
          className={cn("duration-500", progressClassName)}
          cx={size / 2}
          cy={size / 2}
          fill="transparent"
          r={radius}
          stroke="currentColor"
          strokeDasharray={`${circumference}px`}
          strokeDashoffset={`${percentage}px`}
          strokeLinecap={rounded ? "round" : "butt"}
          strokeWidth={`${progressWidth}px`}
        />
      </svg>
      {children}
    </div>
  );
}
