import * as React from "react";
import { ControllerRenderProps, useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";
import { invoke } from "@tauri-apps/api/core";
import clsx from "clsx";
import { Check } from "lucide-react";
import { z } from "zod";

import { camelCaseToTitleCase } from "@/lib/string";
import { cn } from "@/lib/utils";

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

import type { Option } from "@/types/option";

import { Routine } from "./types";

// NOTE: in ts, z.readonly() only affects objects, arrays, tuples, Set, and Map
const formSchema = z.object({
  // TODO(ayvi): allow reordering dailies http://ayvi:3000/ayvi/dailies/issues/39
  ordinalPos: z.coerce.number<number>().readonly(),
  valueId: z.string().readonly(),
  routineId: z.string().readonly(),
  name: z.string().nonempty(),
  group: z.string().nonempty(),
  type: z.enum(Routine.Type.values()),
  maxValue: z.coerce.number<number>().gt(0),
  notes: z.string().nullable(),
  streak: z.coerce.number<number>().nullable(),
  nDays: z.coerce.number<number>().int().nullable(),
  weekdays: z.string().nullable(),
  // prettier-ignore
  date:  z.coerce.date<Date>().nullable().transform((arg: Option<Date>) => (arg ? arg.toISOString().substring(0, 10) : null)),
  // prettier-ignore
  dateStarted:  z.coerce.date().nullable().transform((arg: Option<Date>) => (arg ? arg.toISOString().substring(0, 10) : null)),
  dateArchived: z.iso.date().nullable(),
  // date: z.codec(z.iso.datetime().nullable(), z.date().nullable(), { decode: (isoString: Option<string>): Option<Date> => isoString ? new Date(isoString) : null, encode: (date: Option<Date>): Option<string> => date ? date.toISOString().substring(0, 10) : null, }),
  // dateStarted: z.codec(z.iso.datetime().nullable(), z.date().nullable(), { decode: (isoString: Option<string>): Option<Date> => isoString ? new Date(isoString) : null, encode: (date: Option<Date>): Option<string> => date ? date.toISOString().substring(0, 10) : null, }),
  // dateArchived: z.codec(z.iso.datetime().nullable(), z.date().nullable(), { decode: (isoString: Option<string>): Option<Date> => isoString ? new Date(isoString) : null, encode: (date: Option<Date>): Option<string> => date ? date.toISOString().substring(0, 10) : null, }),
  value: z.coerce.number<number>().gt(0).nullable().readonly(),
  weight: z.coerce.number<number>().gt(0),
  weightedValue: z.coerce.number<number>().gt(0).nullable().readonly(),
  timeMin: z.iso.time().nullable(),
  timeMax: z.iso.time().nullable(),
  timeBucketMin: z.coerce.number<number>().readonly(),
  timeBucketMax: z.coerce.number<number>().readonly(),
});

const formExcludeFields = [
  "valueId",
  "routineId",
  "date",
  "dateStarted",
  "streak",
  "value",
  "weightedValue",
  "timeBucketMin",
  "timeBucketMax",
] as const;

type ExcludedField = (typeof formExcludeFields)[number];

const formReadOnlyFields = ["ordinalPos"] as const;

type ReadOnlyField = (typeof formReadOnlyFields)[number];

export default function EditDailyForm({
  routine,
  dailyFormRef,
  onRefreshAction,
}: {
  routine: Routine;
  dailyFormRef: React.RefObject<Option<HTMLFormElement>>;
  onRefreshAction: () => void;
}): React.ReactElement {
  let originalValues = routine as unknown as z.infer<typeof formSchema>;

  const form = useForm<z.infer<typeof formSchema>>({
    /* @ts-expect-error: 2719 */
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: originalValues,
  });

  const onSubmit = async (values: z.infer<typeof formSchema>): Promise<void> => {
    // TODO(ayvi): send new values only?
    // import { ValueOf } from "next/dist/shared/lib/constants";
    // let changes = {};
    // Object.keys(form.formState.dirtyFields).forEach((key: string) => {
    //   changes[key as keyof typeof Object.prototype] = values[
    //     key as keyof Routine
    //   ] as ValueOf<never>;
    // });
    // console.debug(`changes: ${JSON.stringify(changes)}`);

    await invoke<null>("update_daily", {
      original_daily: originalValues,
      new_daily: values,
    });

    onRefreshAction && onRefreshAction();
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
        {(Object.keys(routine) as (keyof Routine)[])
          .filter((value: string) => !formExcludeFields.includes(value as ExcludedField))
          .map((attr: keyof Routine, idx: number) => {
            form.formState.errors[attr] &&
              console.debug(
                `Error submitting form for field ${attr}: ${form.formState.errors[attr].message}`,
              );

            let render;
            if (attr == "type") {
              render = ({ field }: { field: Field }) => (
                <FormItem className="w-full bg-black">
                  <FormLabel>
                    {camelCaseToTitleCase(attr)}
                    <p className="text-gray-500 italic">
                      ({Routine.RustTypes[attr as keyof typeof Routine.RustTypes]})
                    </p>
                  </FormLabel>
                  <ComboboxForm
                    selectedValue={
                      field.value
                        ? `${Routine.Type.find(field.value as string)}`
                        : "select routine type"
                    }
                    inputPlaceholder={field.name}
                    emptyPlaceholder="no matches..."
                    state={popoverOpen}
                    setState={setPopoverOpen}
                    commandProps={{ className: "bg-black text-white" }}
                    commandListProps={{ className: "bg-black text-white" }}
                    buttonProps={{ className: " bg-black" }}
                    commandItems={Routine.Type.values().map(type => (
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
                      ({Routine.RustTypes[attr as keyof typeof Routine.RustTypes]})
                    </p>
                  </FormLabel>
                  <FormControl>
                    {/* @ts-expect-error: 2322 */}
                    <Input
                      id={`${idx}-${routine.valueId}`}
                      key={`${idx}-${routine.valueId}`}
                      placeholder="none"
                      readOnly={formReadOnlyFields.includes(field.name as ReadOnlyField)}
                      autoComplete="false"
                      aria-autocomplete="none"
                      className="px-3 py-1"
                      {...form.register(attr)}
                      {...field}
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
