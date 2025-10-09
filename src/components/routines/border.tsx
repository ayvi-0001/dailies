import React from "react";

import { cn } from "@/lib/utils";

export default function CardBorder({
  children,
  ...props
}: React.ComponentProps<"div">): React.ReactElement {
  return (
    <div
      className={cn(
        props.className,
        "relative isolate box-content size-auto border-4 bg-white/78 shadow-lg ring-1 ring-black/5 outline-offset-4 transition-all duration-300 ease-in-out select-none hover:translate-y-[-1px] hover:shadow-lg",
      )}
      style={{ height: 150 } as React.CSSProperties}
    >
      <div className="mr-4 ml-4">{children}</div>
    </div>
  );
}
