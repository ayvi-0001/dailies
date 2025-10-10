import * as React from "react";

import { Command as CommandPrimitive } from "cmdk";
import { ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { FormControl } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export default function ComboboxForm<T>({
  selectedValue,
  inputPlaceholder,
  emptyPlaceholder,
  commandItems,
  state,
  setState,
  buttonProps,
  commandProps,
  commandListProps,
}: {
  selectedValue?: T;
  inputPlaceholder: string;
  emptyPlaceholder: string;
  commandItems: React.ReactElement<typeof CommandItem>[];
  onSelect?: (value: string) => void;
  state?: boolean;
  setState?: React.Dispatch<React.SetStateAction<boolean>>;
  buttonProps?: React.ComponentPropsWithoutRef<"button">;
  commandProps?: React.ComponentProps<typeof CommandPrimitive>;
  commandListProps?: React.ComponentProps<typeof CommandPrimitive.List>;
}) {
  return (
    <Popover open={state} onOpenChange={setState}>
      <PopoverTrigger asChild>
        <FormControl>
          <Button
            {...buttonProps}
            variant="outline"
            role="combobox"
            className={cn(
              "justify-between",
              !selectedValue && "text-muted-foreground",
              buttonProps?.className,
            )}
          >
            {inputPlaceholder}
            <ChevronsUpDown className="opacity-50" />
          </Button>
        </FormControl>
      </PopoverTrigger>
      <PopoverContent className="p-0">
        <Command {...commandProps}>
          <CommandInput placeholder={inputPlaceholder} className="h-fit" />
          <CommandList {...commandListProps}>
            <CommandEmpty>{emptyPlaceholder}</CommandEmpty>
            <CommandGroup>{...commandItems}</CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
