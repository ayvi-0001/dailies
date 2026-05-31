import { ClassValue } from "clsx";

import { cn } from "@/lib/utils";

const CONTEXT_MENU_CLASSNAME: ClassValue = cn(
  "focus:bg-accent focus:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 dark:data-[variant=destructive]:focus:bg-destructive/20",
  "data-[variant=destructive]:focus:text-destructive data-[variant=destructive]:*:[svg]:!text-destructive [&_svg:not([class*='text-'])]:text-muted-foreground",
  "data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  "relative flex cursor-default items-center rounded-sm text-xs outline-3 outline-transparent select-none",
);

export default CONTEXT_MENU_CLASSNAME;
