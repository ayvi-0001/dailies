import * as React from "react";
import { ControllerRenderProps, useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";
import { invoke } from "@tauri-apps/api/core";
import { Check, ChevronsUpDown } from "lucide-react";
import { ValueOf } from "next/dist/shared/lib/constants";
import { z } from "zod";

import { cn } from "@/lib/utils";

import { EditSquare } from "@/components/svgs";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

import type { Routine, RoutineAttrs } from "@/types/routines";
import { RoutineType } from "@/types/routines";

// TODO(ayvi): allow reordering dailies http://ayvi:3000/ayvi/dailies/issues/39
const ordinalPos = z.coerce.number<number>().readonly();
const valueId = z.string().readonly();
const routineId = z.string().readonly();
const name = z.string().nonempty();
const group = z.string().nonempty();
const type = z.enum(Object.values(RoutineType));
const maxValue = z.coerce.number<number>().gt(0);
const notes = z.string().nullable();
const nDays = z.coerce.number<number>().int().nullable();
const weekdays = z.string().nullable();
const date = z.coerce
  .date<Date>()
  .nullable()
  .transform((arg: Date | null) =>
    arg ? arg.toISOString().substring(0, 10) : null,
  );
const dateStarted = z.coerce
  .date()
  .nullable()
  .transform((arg: Date | null) =>
    arg ? arg.toISOString().substring(0, 10) : null,
  );
const dateArchived = z.iso.date().nullable();
// dateArchived: z.coerce .date() .nullable() .transform((arg: Date | null) => arg ? arg.toISOString().substring(0, 10) : null, ),
// date: z.codec(z.iso.datetime().nullable(), z.date().nullable(), { decode: (isoString: string | null): Date | null => isoString ? new Date(isoString) : null, encode: (date: Date | null): string | null => date ? date.toISOString().substring(0, 10) : null, }),
// dateStarted: z.codec(z.iso.datetime().nullable(), z.date().nullable(), { decode: (isoString: string | null): Date | null => isoString ? new Date(isoString) : null, encode: (date: Date | null): string | null => date ? date.toISOString().substring(0, 10) : null, }),
// dateArchived: z.codec(z.iso.datetime().nullable(), z.date().nullable(), { decode: (isoString: string | null): Date | null => isoString ? new Date(isoString) : null, encode: (date: Date | null): string | null => date ? date.toISOString().substring(0, 10) : null, }),
const value = z.coerce.number<number>().gt(0).nullable().readonly();
const weight = z.coerce.number<number>().gt(0);
const weightedValue = z.coerce.number<number>().gt(0).nullable().readonly();
const timeMin = z.iso.time().nullable();
const timeMax = z.iso.time().nullable();
const timeBucketMin = z.coerce.number<number>().readonly();
const timeBucketMax = z.coerce.number<number>().readonly();

// NOTE: in ts, z.readonly() only affects objects, arrays, tuples, Set, and Map
const formSchemaObjects = {
  ordinalPos: ordinalPos,
  valueId: valueId,
  routineId: routineId,
  name: name,
  group: group,
  type: type,
  maxValue: maxValue,
  notes: notes,
  nDays: nDays,
  weekdays: weekdays,
  date: date,
  dateStarted: dateStarted,
  dateArchived: dateArchived,
  value: value,
  weight: weight,
  weightedValue: weightedValue,
  timeMin: timeMin,
  timeMax: timeMax,
  timeBucketMin: timeBucketMin,
  timeBucketMax: timeBucketMax,
};

const formSchema = z.object(formSchemaObjects);

// // NOTE: in ts, z.readonly() only affects objects, arrays, tuples, Set, and Map
// const formSchema = z.object({
//   ordinalPos: z.coerce.number<number>().readonly(), // TODO(ayvi): allow reordering dailies http://ayvi:3000/ayvi/dailies/issues/39
//   valueId: z.string().readonly(),
//   routineId: z.string().readonly(),
//   name: z.string().nonempty(),
//   group: z.string().nonempty(),
//   type: z.enum(Object.values(RoutineType)),
//   maxValue: z.coerce.number<number>().gt(0),
//   notes: z.string().nullable(),
//   nDays: z.coerce.number<number>().int().nullable(),
//   weekdays: z .string() .nullable() .transform((arg: string | null) => (arg ? `[${arg}]` : null)),
//   date: z.coerce .date<Date>() .nullable() .transform((arg: Date | null) => arg ? arg.toISOString().substring(0, 10) : null, ),
//   dateStarted: z.coerce .date() .nullable() .transform((arg: Date | null) => arg ? arg.toISOString().substring(0, 10) : null, ),
//   dateArchived: z.iso.date().nullable(),
//   // dateArchived: z.coerce .date() .nullable() .transform((arg: Date | null) => arg ? arg.toISOString().substring(0, 10) : null, ),
//   // date: z.codec(z.iso.datetime().nullable(), z.date().nullable(), { decode: (isoString: string | null): Date | null => isoString ? new Date(isoString) : null, encode: (date: Date | null): string | null => date ? date.toISOString().substring(0, 10) : null, }),
//   // dateStarted: z.codec(z.iso.datetime().nullable(), z.date().nullable(), { decode: (isoString: string | null): Date | null => isoString ? new Date(isoString) : null, encode: (date: Date | null): string | null => date ? date.toISOString().substring(0, 10) : null, }),
//   // dateArchived: z.codec(z.iso.datetime().nullable(), z.date().nullable(), { decode: (isoString: string | null): Date | null => isoString ? new Date(isoString) : null, encode: (date: Date | null): string | null => date ? date.toISOString().substring(0, 10) : null, }),
//   value: z.coerce.number<number>().gt(0).nullable().readonly(),
//   weight: z.coerce.number<number>().gt(0),
//   weightedValue: z.coerce.number<number>().gt(0).nullable().readonly(),
//   timeMin: z.iso.time().nullable(),
//   timeMax: z.iso.time().nullable(),
//   timeBucketMin: z.coerce.number<number>().readonly(),
//   timeBucketMax: z.coerce.number<number>().readonly(),
// });

export default function EditDialog({
  routine,
  onRefreshAction,
}: {
  routine: Routine;
  onRefreshAction: () => void;
}): React.ReactNode {
  const dailyFormRef: React.RefObject<HTMLFormElement | null> =
    React.createRef<HTMLFormElement>();

  const handleSubmitButtonRef = async (): Promise<void> => {
    dailyFormRef?.current?.requestSubmit();
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="default" size="sm">
          <EditSquare />
        </Button>
      </DialogTrigger>
      <DialogContent className="h-[80vh] bg-black/90 text-white ">
        <ScrollArea className="h-[70vh] rounded-md">
          <DialogHeader>
            <DialogTitle>{routine.name}</DialogTitle>
            <DialogDescription className="mb-5">
              Value changes will apply to the current date.
            </DialogDescription>
          </DialogHeader>
          <EditDailyForm
            routine={routine}
            dailyFormRef={dailyFormRef}
            onRefreshAction={onRefreshAction}
          />
          <DialogFooter className="mt-4 mb-3 flex gap-2 leading-none font-medium justify-center select-none">
            <DialogClose asChild className="text-black">
              <Button
                variant="outline"
                className="bg-slate-700 text-slate-300 shadow hover:slate-700/90"
              >
                cancel
              </Button>
            </DialogClose>
            <DialogClose asChild className="text-black">
              <Button
                variant="outline"
                className="bg-gray-300 text-gray-700 shadow hover:gray-300/90"
                onClick={handleSubmitButtonRef}
              >
                save
              </Button>
            </DialogClose>
          </DialogFooter>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function EditDailyForm({
  routine,
  dailyFormRef,
  onRefreshAction,
}: {
  routine: Routine;
  dailyFormRef: React.RefObject<HTMLFormElement | null>;
  onRefreshAction: () => void;
}): React.ReactElement {
  let originalValues: z.infer<typeof formSchema> = {
    ordinalPos: routine.ordinalPos,
    valueId: routine.valueId,
    routineId: routine.routineId,
    name: routine.name,
    group: routine.group,
    type: routine.type,
    maxValue: routine.maxValue,
    notes: routine.notes,
    nDays: routine.nDays,
    weekdays: routine.weekdays,
    /* @ts-expect-error: 2322 */
    date: routine.date,
    /* @ts-expect-error: 2322 */
    dateStarted: routine.dateStarted,
    /* @ts-expect-error: 2322 */
    dateArchived: routine.dateArchived,
    value: routine.value,
    weight: routine.weight,
    weightedValue: routine.weightedValue,
    timeMin: routine.timeMin,
    timeMax: routine.timeMax,
    timeBucketMin: routine.timeBucketMin,
    timeBucketMax: routine.timeBucketMax,
  };

  const form = useForm<z.infer<typeof formSchema>>({
    /* @ts-expect-error: 2719 */
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: originalValues,
  });

  const onSubmit = async (
    values: z.infer<typeof formSchema>,
  ): Promise<void> => {
    console.debug(`original_daily: ${JSON.stringify(originalValues)}`);
    console.debug(`new_daily: ${JSON.stringify(values)}`);

    // TODO(ayvi): send new values only?
    // import { ValueOf } from "next/dist/shared/lib/constants";
    // let changes = {};
    // Object.keys(form.formState.dirtyFields).forEach((key: string) => {
    //   console.debug(`${key}`);
    //   console.debug(`${values[key as keyof Routine] as ValueOf<Routine>}`);
    //   changes[key as keyof typeof Object.prototype] = values[
    //     key as keyof Routine
    //   ] as ValueOf<never>;
    // });
    // console.debug(`changes: ${JSON.stringify(changes)}`);

    await invoke<null>("update_daily", {
      original_daily: originalValues,
      new_daily: values,
    });

    onRefreshAction();
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
        {(Object.keys(routine) as RoutineAttrs[])
          .filter((value: string) => !FormExcludeFields.includes(value))
          .map((attr: RoutineAttrs, idx: number) => {
            form.formState.errors[attr] &&
              console.debug(
                `Error submitting form for field ${attr}: ${form.formState.errors[attr].message}`,
              );

            if (attr == "type") {
              return (
                <FormField
                  key={idx}
                  /* @ts-expect-error: 2322 */
                  control={form.control}
                  name={attr}
                  render={({ field }: { field: Field }) => (
                    <FormItem className="bg-black w-full">
                      <FormLabel>
                        {camelCaseToTitleCase(attr)}
                        <p className="text-gray-500 italic">
                          ({formSchemaObjects[attr].type})
                        </p>
                      </FormLabel>
                      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "justify-between bg-black",
                                !field.value && "text-muted-foreground",
                              )}
                            >
                              {field.value
                                ? Object.values(RoutineType)
                                    .filter(
                                      (value: RoutineType) =>
                                        (field.value as ValueOf<RoutineType>) ===
                                        value,
                                    )
                                    .at(0)
                                : "select routine type"}
                              <ChevronsUpDown className="opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="p-0">
                          <Command className="bg-black text-white">
                            <CommandInput
                              placeholder={field.name}
                              className="h-fit"
                            />
                            <CommandList className="bg-black text-white">
                              <CommandEmpty>no matches..</CommandEmpty>
                              <CommandGroup>
                                {Object.values(RoutineType).map(
                                  (type: RoutineType) => (
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
                                        className={cn(
                                          // "ml-auto",
                                          type === field.value
                                            ? "opacity-100"
                                            : "opacity-0",
                                        )}
                                      />
                                    </CommandItem>
                                  ),
                                )}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </FormItem>
                  )}
                />
              );
            } else {
              return (
                <FormField
                  key={idx}
                  /* @ts-expect-error: 2322 */
                  control={form.control}
                  name={attr}
                  render={({ field }: { field: Field }) => (
                    <FormItem>
                      <FormLabel>
                        {camelCaseToTitleCase(attr)}
                        <p className="text-gray-500 italic">
                          (
                          {
                            // TODO(ayvi): map correct types
                            formSchemaObjects[attr].type !== "nullable"
                              ? formSchemaObjects[attr].type
                              : formSchemaObjects[attr].def?.innerType?.type
                          }
                          )
                        </p>
                      </FormLabel>
                      <FormControl>
                        {/* @ts-expect-error: 2322 */}
                        <Input
                          id={`${idx}-${routine.valueId}`}
                          key={`${idx}-${routine.valueId}`}
                          placeholder="none"
                          readOnly={ReadOnlyFields.includes(field.name)}
                          autoComplete="false"
                          aria-autocomplete="none"
                          {...form.register(attr)}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-gray-500 italic">
                        {/*ReadOnlyFields.includes(field.name) && `(readonly)`*/}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              );
            }
          })}
      </form>
    </Form>
  );
}

const FormExcludeFields: string[] = [
  "valueId",
  "routineId",
  "date",
  "dateStarted",
  "value",
  "weightedValue",
  "timeBucketMin",
  "timeBucketMax",
] as const;

const ReadOnlyFields: string[] = ["ordinalPos"] as const;

function camelCaseToTitleCase(camelCaseString: string): string {
  // Add a space before each uppercase letter (except the first one)
  // and then capitalize the first letter of the entire string
  const spacedString = camelCaseString.replace(/([A-Z])/g, " $1");

  // Capitalize the first letter of each word and convert the rest to lowercase
  return spacedString
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ")
    .trim(); // Remove any leading/trailing spaces
}
