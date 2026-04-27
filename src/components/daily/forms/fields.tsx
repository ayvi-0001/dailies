import * as React from "react";

import * as heroui from "@heroui/react";
import { CalendarDate, DateValue, Time, today } from "@internationalized/date";
import type { ValidationResult } from "@react-types/shared/src/inputs";
import { X } from "lucide-react";

import { Daily } from "@/components/daily";
import { DaysOfWeek, LOCAL_TZ } from "@/lib/dates";
import type { Option } from "@/types/option";

import { QuestType } from "../providers/quest-types";

type NameFieldProps = {
  name: Option<string>;
  nameErrors: React.ReactNode[];
  setNameAction: React.Dispatch<React.SetStateAction<Option<string>>>;
};

export function NameField(props: NameFieldProps): React.ReactElement {
  const { name, nameErrors, setNameAction } = props;

  return (
    <heroui.Input
      isRequired
      aria-autocomplete="none"
      className="text-sm text-white"
      classNames={{ innerWrapper: "text-xs" }}
      errorMessage={(_: ValidationResult) => mapErrors(nameErrors)}
      isInvalid={nameErrors?.length > 0}
      label="Name"
      name="name"
      radius="none"
      type="text"
      value={name ?? ""}
      variant="bordered"
      onValueChange={setNameAction}
    />
  );
}

type TypeFieldProps = {
  daily?: Daily;
  questType: Option<string>;
  questTypes: QuestType[];
  setQuestTypesAction: React.Dispatch<React.SetStateAction<Option<string>>>;
};

export function TypeField(props: TypeFieldProps): React.ReactElement {
  const { daily, questType, questTypes, setQuestTypesAction } = props;

  return (
    <heroui.Autocomplete
      isRequired
      className="text-sm text-white"
      classNames={{ base: "text-sm" }}
      defaultInputValue={
        daily &&
        questTypes.find((type: QuestType) => type.id === `${daily.type}`.replace("_", "-"))?.name
      }
      defaultItems={questTypes.filter(questType => questType.available)}
      label="Type"
      name="typeId"
      radius="none"
      type="text"
      value={questType ?? ""}
      variant="bordered"
      onInputChange={(value: string) => {
        setQuestTypesAction(questTypes.find(type => type.name == value)?.id || null);
      }}
      onValueChange={(value: string) => {
        setQuestTypesAction(value);
      }}
    >
      {questType => (
        <heroui.AutocompleteItem key={questType.id} className="dark">
          {questType.name}
        </heroui.AutocompleteItem>
      )}
    </heroui.Autocomplete>
  );
}

type ChainFieldProps = {
  daily?: Daily;
  questChains: string[];
};

export function ChainField(props: ChainFieldProps): React.ReactElement {
  const { daily, questChains } = props;

  return (
    <heroui.Autocomplete
      allowsCustomValue
      isRequired
      className="text-sm text-white"
      classNames={{ base: "text-sm" }}
      defaultInputValue={daily?.chain ?? ""}
      defaultItems={questChains.map(questChain => {
        return { key: questChain, name: questChain };
      })}
      label="Chain"
      name="chain"
      radius="none"
      type="text"
      variant="bordered"
    >
      {questType => (
        <heroui.AutocompleteItem key={questType.key} className="dark">
          {questType.name}
        </heroui.AutocompleteItem>
      )}
    </heroui.Autocomplete>
  );
}

export function WeightField({ daily }: { daily?: Daily }): React.ReactElement {
  return (
    <heroui.NumberInput
      isRequired
      className="text-sm text-white"
      classNames={{ innerWrapper: "text-xs" }}
      defaultValue={daily?.weight ?? 1}
      label="Weight"
      minValue={1}
      name="weight"
      radius="none"
      type="number"
      variant="bordered"
    />
  );
}

type TotalFieldProps = {
  total: number;
  setTotalAction: React.Dispatch<React.SetStateAction<number>>;
};

export function TotalField(props: TotalFieldProps): React.ReactElement {
  const { total, setTotalAction } = props;

  return (
    <heroui.NumberInput
      isRequired
      className="text-sm text-white"
      classNames={{ innerWrapper: "text-xs" }}
      label="Total"
      minValue={1}
      name="total"
      radius="none"
      type="number"
      value={total ?? 1}
      variant="bordered"
      onValueChange={setTotalAction}
    />
  );
}

type DefaultPointsFieldProps = {
  defaultPoints: number;
  setDefaultPointsAction: React.Dispatch<React.SetStateAction<number>>;
  defaultPointsErrors: React.ReactNode[];
};

export function DefaultPointsField(props: DefaultPointsFieldProps): React.ReactElement {
  const { defaultPoints, setDefaultPointsAction, defaultPointsErrors } = props;

  return (
    <heroui.NumberInput
      isRequired
      className="text-sm text-white"
      classNames={{ innerWrapper: "text-xs", label: "text-xs" }}
      errorMessage={(_: ValidationResult) => mapErrors(defaultPointsErrors)}
      isInvalid={defaultPointsErrors?.length > 0}
      label="Default Points"
      minValue={0}
      name="defaultPoints"
      radius="none"
      type="number"
      value={defaultPoints}
      variant="bordered"
      onValueChange={setDefaultPointsAction}
    />
  );
}

export function StreakTargetField({ daily }: { daily?: Daily }): React.ReactElement {
  return (
    <heroui.NumberInput
      className="text-sm text-white"
      classNames={{ innerWrapper: "text-xs", label: "text-xs" }}
      defaultValue={daily?.streakTarget ?? undefined}
      label="Streak Target"
      minValue={1}
      name="streakTarget"
      radius="none"
      type="number"
      variant="bordered"
    />
  );
}

type TimeStartFieldProps = {
  timeStart: Option<Time>;
  setTimeStartAction: React.Dispatch<React.SetStateAction<Option<Time>>>;
  timeStartErrors: React.ReactNode[];
};

export function TimeStartField(props: TimeStartFieldProps): React.ReactElement {
  const { timeStart, setTimeStartAction, timeStartErrors } = props;

  return (
    <heroui.TimeInput
      isRequired
      className="text-sm text-white"
      classNames={{ innerWrapper: "text-xs" }}
      errorMessage={(_: ValidationResult) => mapErrors(timeStartErrors)}
      isInvalid={timeStartErrors?.length > 0}
      label="Start"
      name="timeStart"
      radius="none"
      value={timeStart}
      variant="bordered"
      onChange={setTimeStartAction}
    />
  );
}

type TimeEndFieldProps = {
  timeEnd: Option<Time>;
  setTimeEndAction: React.Dispatch<React.SetStateAction<Option<Time>>>;
  timeEndErrors: React.ReactNode[];
};

export function TimeEndField(props: TimeEndFieldProps): React.ReactElement {
  const { timeEnd, setTimeEndAction, timeEndErrors } = props;

  return (
    <heroui.TimeInput
      isRequired
      className="text-sm text-white"
      classNames={{ innerWrapper: "text-xs" }}
      errorMessage={(_: ValidationResult) => mapErrors(timeEndErrors)}
      isInvalid={timeEndErrors?.length > 0}
      label="End"
      name="timeEnd"
      radius="none"
      value={timeEnd}
      variant="bordered"
      onChange={setTimeEndAction}
    />
  );
}

export function DescriptionField({ daily }: { daily?: Daily }): React.ReactElement {
  return (
    <heroui.Textarea
      disableAutosize
      isClearable
      className="-mt-1 text-sm text-white"
      classNames={{
        base: "text-sm",
        innerWrapper: "text-xs",
        input: "resize-y min-h-[40px] text-xs",
        label: "text-xs",
      }}
      defaultValue={daily?.description ?? ""}
      label="Description"
      name="description"
      radius="none"
      variant="bordered"
    />
  );
}

export function NoteField({ daily }: { daily?: Daily }): React.ReactElement {
  return (
    <heroui.Textarea
      disableAutosize
      isClearable
      className="-mt-1 text-sm text-white"
      classNames={{
        base: "text-sm",
        innerWrapper: "text-xs",
        input: "resize-y min-h-[40px] text-xs",
        label: "text-xs",
      }}
      defaultValue={daily?.note ?? ""}
      label={`Note ${daily?.date && `(${daily.date})`}`}
      name="note"
      radius="none"
      variant="bordered"
    />
  );
}

export function RequirementsField({ daily }: { daily?: Daily }): React.ReactElement {
  return (
    <heroui.Input
      isRequired
      className="flex-1 text-sm text-white"
      classNames={{
        innerWrapper: "text-xs",
        input: "text-xs",
        inputWrapper: "text-xs",
      }}
      defaultValue={daily?.requirements ? `${daily?.requirements}` : undefined}
      label="Requirements"
      name="requirements"
      radius="none"
      type="text"
      variant="bordered"
    />
  );
}

type ArchivedFieldProps = {
  archivedDate: Option<DateValue>;
  setArchivedDateAction: React.Dispatch<React.SetStateAction<Option<DateValue>>>;
};

export function ArchivedField(props: ArchivedFieldProps): React.ReactElement {
  const { archivedDate, setArchivedDateAction } = props;
  const now: CalendarDate = today(LOCAL_TZ);

  return (
    <heroui.DatePicker
      granularity="day"
      label="Archived"
      maxValue={now}
      name="archived"
      radius="none"
      startContent={
        archivedDate ? (
          <heroui.Button
            className="m-0 h-fit min-w-0 border-none p-0 px-0 py-0"
            size="sm"
            variant="ghost"
            onPress={() => {
              setArchivedDateAction(null);
            }}
          >
            <X size={18} />
          </heroui.Button>
        ) : (
          <></>
        )
      }
      value={archivedDate}
      variant="bordered"
      onChange={setArchivedDateAction}
    />
  );
}

type DaysFieldProps = {
  days: Option<string[]>;
  setDaysAction: React.Dispatch<React.SetStateAction<string[]>>;
};

export function DaysField(props: DaysFieldProps): React.ReactElement {
  const { days, setDaysAction } = props;
  return (
    <heroui.CheckboxGroup
      isRequired
      className="mt-1 flex gap-1 self-center"
      classNames={{ wrapper: "gap-1" }}
      color="primary"
      description="Days"
      isInvalid={(days || []).length == 0}
      name="days"
      orientation="horizontal"
      radius="none"
      size="md"
      value={days ?? []}
      onValueChange={setDaysAction}
    >
      {Object.values(DaysOfWeek)
        .filter(value => typeof value !== "number")
        .map((day: string, idx: number) => (
          <div key={day} className="flex flex-col">
            <div className="place-self-center text-xs">{`${day}`.at(0)}</div>
            <heroui.Checkbox
              classNames={{
                base: "m-0 p-0  flex flex-row",
                label: "p-0 m-0 justify-center",
                icon: "justify-center m-0",
                hiddenInput: "m-0",
                wrapper: "m-0",
              }}
              radius="full"
              value={`${idx}`}
            />
          </div>
        ))}
    </heroui.CheckboxGroup>
  );
}

const mapErrors = (errArr: React.ReactNode[]): React.ReactElement => (
  <ul>
    {errArr.map((error, i) => (
      <li key={i} className="text-xs text-red-500">
        {error}
      </li>
    ))}
  </ul>
);
