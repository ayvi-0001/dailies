import * as React from "react";

import * as motion from "motion/react-client";
import { ClassValue } from "clsx";

import { cn } from "@/lib/utils";

import { Daily } from "./types";

type CardBorderProps = Readonly<{
  daily: Daily;
  divProps: React.ComponentProps<"div">;
  children: React.ReactNode;
}>;

export default function CardBorder(props: CardBorderProps): React.ReactElement {
  const { daily, divProps, children } = props;
  const cardDimensionStyles: ClassValue = "h-20 w-[95%]";

  return (
    <>
      <motion.div
        className={cn(
          divProps.className,
          cardDimensionStyles,
          "relative z-90 box-content border-3 bg-white/70 shadow-lg",
        )}
        id={`daily-${daily.name}`}
        whileFocus={{ scale: 1.02 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 1.02 }}
      >
        <div className={cn(cardDimensionStyles, "flex w-full")}>{children}</div>
      </motion.div>
      {!!daily.archived && (
        <div
          className={cn(
            divProps.className,
            "px-41", // TODO(ayvi): figure out why w-full size changes with motion
            // http://ayvi:3000/ayvi/dailies/issues/111
            "fixed z-91 box-content flex transform-none items-center justify-center border-3 border-black/80 bg-black/70 shadow-lg",
          )}
        >
          <div className={cn(cardDimensionStyles, "w-full")}></div>
        </div>
      )}
    </>
  );
}
