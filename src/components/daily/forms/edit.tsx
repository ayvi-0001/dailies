import * as React from "react";
import { ControllerRenderProps, useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";
import { invoke } from "@tauri-apps/api/core";
import clsx from "clsx";
import { Check } from "lucide-react";
import { ValueOf } from "next/dist/shared/lib/constants";
import { z } from "zod";

import ComboboxForm from "@/components/combobox-form";
import { CommandItem } from "@/components/ui/command";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import Input from "@/components/ui/input";
import { camelCaseToTitleCase } from "@/lib/string";
import { cn } from "@/lib/utils";
import type { Option } from "@/types/option";

import { Daily } from "../types";

// NOTE: in ts, z.readonly() only affects objects, arrays, tuples, Set, and Map
const formSchema = z.object({
  user: z.string().readonly(),
  // prettier-ignore
  date:  z.coerce.date<Date>().nullable().transform((arg: Option<Date>) => (arg ? arg.toISOString().substring(0, 10) : null)),
  // date: z.codec(z.iso.datetime().nullable(), z.date().nullable(), { decode: (isoString: Option<string>): Option<Date> => isoString ? new Date(isoString) : null, encode: (date: Option<Date>): Option<string> => date ? date.toISOString().substring(0, 10) : null, }),
  pointId: z.string().readonly(),
  questId: z.string().readonly(),
  // TODO(ayvi): allow reordering dailies http://ayvi:3000/ayvi/dailies/issues/39
  sequence: z.coerce.number<number>().readonly(),
  chain: z.string().nonempty(),
  name: z.string().nonempty(),
  type: z.enum(Daily.Type.values()),
  points: z.coerce.number<number>().gt(0).nullable().readonly(),
  total: z.coerce.number<number>().gt(0),
  weight: z.coerce.number<number>().gt(0),
  streakTarget: z.coerce.number<number>().nullable(),
  requirements: z.any().nullable(),
  timeMin: z.iso.time().nullable(),
  timeMax: z.iso.time().nullable(),
  // prettier-ignore
  accepted:  z.coerce.date().nullable().transform((arg: Option<Date>) => (arg ? arg.toISOString().substring(0, 10) : null)),
  // accepted: z.codec(z.iso.datetime().nullable(), z.date().nullable(), { decode: (isoString: Option<string>): Option<Date> => isoString ? new Date(isoString) : null, encode: (date: Option<Date>): Option<string> => date ? date.toISOString().substring(0, 10) : null, }),
  archived: z.iso.date().nullable(),
  // archived: z.codec(z.iso.datetime().nullable(), z.date().nullable(), { decode: (isoString: Option<string>): Option<Date> => isoString ? new Date(isoString) : null, encode: (date: Option<Date>): Option<string> => date ? date.toISOString().substring(0, 10) : null, }),
  days: z.array(z.number()).nullable(),
  note: z.string().nullable(),
  streak: z.coerce.number<number>().nullable(),
  complete: z.coerce.number<number>().nullable(),
  pointsWeighted: z.coerce.number<number>().nullable(),
});

const formExcludeFields = [
  "user",
  "date",
  "questId",
  "pointId",
  "accepted",
  "streak",
  "points",
  "complete",
  "pointsWeighted",
] as const;

type ExcludedField = (typeof formExcludeFields)[number];

const formReadOnlyFields = ["sequence"] as const;

type ReadOnlyField = (typeof formReadOnlyFields)[number];

export default function EditDailyForm({
  daily,
  dailyFormRef,
  onRefreshAction,
}: {
  daily: Daily;
  dailyFormRef: React.RefObject<Option<HTMLFormElement>>;
  onRefreshAction?: () => void;
}): React.ReactElement {
  const originalValues = daily as unknown as z.infer<typeof formSchema>;

  const form = useForm<z.infer<typeof formSchema>>({
    /* @ts-expect-error: 2719 */
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: originalValues,
  });

  const onSubmit = async (values: z.infer<typeof formSchema>): Promise<void> => {
    // TODO(ayvi): send diff only?
    const changes = {};
    Object.keys(form.formState.dirtyFields).forEach((key: string) => {
      changes[key as keyof typeof Object.prototype] = values[key as keyof Daily] as ValueOf<never>;
    });
    console.debug(`changes: ${JSON.stringify(changes)}`);

    await invoke<null>("update_daily", {
      original_daily: originalValues,
      new_daily: values,
    });

    if (onRefreshAction) onRefreshAction();
  };

  const [popoverOpen, setPopoverOpen] = React.useState<boolean>(false);

  type Field = ControllerRenderProps<z.infer<typeof formSchema>>;

  return (
    <Form {...form}>
      <form
        ref={dailyFormRef}
        /* @ts-expect-error: 2345 */
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-8"
      >
        {(Object.keys(daily) as (keyof Daily)[])
          .filter((value: string) => !formExcludeFields.includes(value as ExcludedField))
          .map((attr: keyof Daily, idx: number) => {
            if (form.formState.errors[attr]) {
              console.debug(
                `Error submitting form for field ${attr}: ${form.formState.errors[attr].message}`,
              );
            }

            let render;
            if (attr == "type") {
              render = ({ field }: { field: Field }) => (
                <FormItem className="w-full bg-black">
                  <FormLabel>
                    {camelCaseToTitleCase(attr)}
                    <p className="text-gray-500 italic">
                      ({Daily.RustTypes[attr as keyof typeof Daily.RustTypes]})
                    </p>
                  </FormLabel>
                  <ComboboxForm
                    selectedValue={
                      field.value
                        ? `${Daily.Type.find(field.value as string)}`
                        : "select daily type"
                    }
                    inputPlaceholder={field.name}
                    emptyPlaceholder="no matches..."
                    state={popoverOpen}
                    setState={setPopoverOpen}
                    commandProps={{ className: "bg-black text-white" }}
                    commandListProps={{ className: "bg-black text-white" }}
                    buttonProps={{ className: " bg-black" }}
                    commandItems={Daily.Type.values().map(type => (
                      <CommandItem
                        className="bg-black text-white"
                        value={type}
                        key={type}
                        onSelect={() => {
                          form.setValue(field.name, type);
                          setPopoverOpen(false);
                        }}
                      >
                        {type}
                        <Check
                          className={cn(clsx(type === field.value ? "opacity-100" : "opacity-0"))}
                        />
                      </CommandItem>
                    ))}
                  />
                </FormItem>
              );
            } else {
              render = ({ field }: { field: Field }) => (
                <FormItem>
                  <FormLabel>
                    {camelCaseToTitleCase(attr)}
                    <p className="text-gray-500 italic">
                      ({Daily.RustTypes[attr as keyof typeof Daily.RustTypes]})
                    </p>
                  </FormLabel>
                  <FormControl>
                    <Input
                      id={`${idx}-${daily.pointId}`}
                      key={`${idx}-${daily.pointId}`}
                      defaultValue={`${field.value ? field.value : ""}`}
                      placeholder="none"
                      readOnly={formReadOnlyFields.includes(field.name as ReadOnlyField)}
                      autoComplete="false"
                      aria-autocomplete="none"
                      className="px-3 py-1"
                      {...form.register(attr)}
                    />
                  </FormControl>
                  <FormDescription className="text-gray-500 italic">
                    {formReadOnlyFields.includes(field.name as ReadOnlyField) && `(readonly)`}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              );
            }

            return (
              <FormField
                key={idx}
                /* @ts-expect-error: 2322 */
                control={form.control}
                name={attr}
                render={render}
              />
            );
          })}
      </form>
    </Form>
  );
}
