"use client";

import * as React from "react";

import * as heroui from "@heroui/react";
import { HTMLMotionProps } from "framer-motion";

import type { Option } from "@/types/option";

type DescriptionProps = {
  description: Option<string>;
};

export default function Description(props: DescriptionProps): React.ReactElement {
  const { description } = props;

  const motionProps: Omit<HTMLMotionProps<"div">, "ref"> = {
    variants: {
      exit: { opacity: 0, transition: { duration: 0.1, ease: "easeIn" } },
      enter: { opacity: 1, transition: { duration: 0.15, ease: "easeOut" } },
    },
  };

  return (
    <heroui.Popover motionProps={motionProps} placement="bottom-start">
      <heroui.PopoverTrigger className="wrap-break-word">
        <p className="mt-[0.15rem] line-clamp-2 overflow-hidden text-[0.55rem] leading-none tracking-tight text-ellipsis">
          {description ?? ""}
        </p>
      </heroui.PopoverTrigger>
      <heroui.PopoverContent className="border-none bg-transparent shadow-none outline-none select-none">
        <p className="border-1 border-white bg-black/60 p-2 text-xs text-white">
          {description ?? ""}
        </p>
      </heroui.PopoverContent>
    </heroui.Popover>
  );
}
