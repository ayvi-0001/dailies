import * as React from "react";

import { cn } from "@/lib/utils";

export default function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      data-slot="input"
      className={cn(
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "placeholder:text-muted-foreground dark:bg-input/30 border-input min-w-3 rounded-md border bg-transparent text-base shadow-xs transition-[color,box-shadow] outline-none",
        "selection:bg-primary selection:text-primary-foreground",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "file:text-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className,
      )}
      {...props}
    />
  );
}
