import * as React from "react";

import { type SpringOptions, useInView, useMotionValue, useSpring } from "framer-motion";

import { cn } from "@/lib/utils";

interface CounterProps {
  /**
   * A function to format the counter value. By default, it will format the
   * number with commas.
   */
  format?: (value: number) => string;

  /**
   * The target value of the counter.
   */
  targetValue: number;

  /**
   * The direction of the counter. If "up", the counter will start from 0 and
   * go up to the target value. If "down", the counter will start from the target
   * value and go down to 0.
   */
  direction?: "up" | "down";

  /**
   * The delay in milliseconds before the counter starts counting.
   */
  delay?: number;

  /**
   * Additional classes for the counter.
   */
  className?: string;

  /**
   * Stiffness of the spring. Higher values will create more sudden movement.
   * Set to `100` by default.
    stiffness?: number;
   * Strength of opposing force. If set to 0, spring will oscillate
   * indefinitely. Set to `10` by default.
    damping?: number;
   * Mass of the moving object. Higher values will result in more lethargic
   * movement. Set to `1` by default.
    mass?: number;
   */
  springOptions?: SpringOptions;
}

export const Formatter = {
  number: (value: number) => Intl.NumberFormat("en-US").format(+value.toFixed(0)),
  currency: (value: number) =>
    Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(+value.toFixed(0)),
};

export default function Counter(props: CounterProps) {
  const {
    format = Formatter.number,
    targetValue,
    direction = "up",
    delay = 0,
    className,
    springOptions,
  } = props;

  const ref = React.useRef<HTMLSpanElement>(null);
  const isGoingUp = direction === "up";
  const motionValue = useMotionValue(isGoingUp ? 0 : targetValue);

  const springValue = useSpring(motionValue, springOptions);
  const isInView = useInView(ref, { margin: "0px", once: true });

  React.useEffect(() => {
    if (!isInView) {
      return;
    }

    const timer = setTimeout(() => {
      motionValue.set(isGoingUp ? targetValue : 0);
    }, delay);

    return () => clearTimeout(timer);
  }, [isInView, delay, isGoingUp, targetValue, motionValue]);

  React.useEffect(() => {
    springValue.on("change", (value) => {
      if (ref.current) {
        ref.current.textContent = format ? format(value) : `${value}`;
      }
    });
  }, [springValue, format]);

  return <span ref={ref} className={cn("text-foreground text-4xl font-bold", className)} />;
}
