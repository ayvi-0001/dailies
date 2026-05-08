"use client";

import * as React from "react";

import * as heroui from "@heroui/react";
import { Time } from "@internationalized/date";

import { Option } from "@/types/option";

import * as DailyForm from "./fields";
import { DailiesState, Quest, useDailies } from "../../daily";
import { QuestType } from "../providers/quest-types";

type AddQuestFormProps = {
  formRef: React.RefObject<Option<HTMLFormElement>>;
  action: (payload: FormData) => void;
  questTypes: QuestType[];
};

export default function AddQuestForm(props: AddQuestFormProps): React.ReactElement {
  const { formRef, action, questTypes } = props;

  const dailiesState: DailiesState = useDailies();

  const [name, setName] = React.useState<Option<string>>(null);
  const nameErrors: React.ReactNode[] = [];
  if (name && name.length < 3) nameErrors.push("Name must be at least 3 characters long.");
  if (name && name.length > 20) nameErrors.push("Name must be 20 characters or less.");

  const [questType, setQuestType] = React.useState<Option<string>>(null);

  const [timeStart, setTimeStart] = React.useState<Option<Time>>(null);
  const [timeEnd, setTimeEnd] = React.useState<Option<Time>>(null);
  const timeStartErrors: React.ReactNode[] = [];
  const timeEndErrors: React.ReactNode[] = [];
  if (timeStart && timeEnd && timeStart > timeEnd)
    timeStartErrors.push("Start time cannot be after end time.");
  if (timeStart && timeEnd && timeStart > timeEnd)
    timeEndErrors.push("End time cannot be before start time.");
  if (timeStart && timeEnd && `${timeStart}` === `${timeEnd}`) {
    timeStartErrors.push("Start time cannot be the same as end time.");
    timeEndErrors.push("End time cannot be the same as start time.");
  }

  const [total, setTotal] = React.useState<number>(1);
  const [defaultPoints, setDefaultPoints] = React.useState<number>(0);
  const defaultPointsErrors: React.ReactNode[] = [];
  if (total && defaultPoints && defaultPoints > total)
    defaultPointsErrors.push("Default points cannot be greater than total points.");

  const [days, setDays] = React.useState<string[]>([]);

  return (
    <heroui.Form
      ref={formRef}
      action={action}
      className="flex flex-col gap-2"
      validationBehavior="native"
    >
      <DailyForm.NameField name={name} nameErrors={nameErrors} setNameAction={setName} />
      <DailyForm.TypeField
        questType={questType}
        questTypes={questTypes}
        setQuestTypesAction={setQuestType}
      />
      <DailyForm.ChainField questChains={dailiesState.questChains} />
      <div className="flex w-full flex-row gap-2">
        <DailyForm.TotalField setTotalAction={setTotal} total={total} />
        {
          <DailyForm.DefaultPointsField
            defaultPoints={defaultPoints}
            defaultPointsErrors={defaultPointsErrors}
            setDefaultPointsAction={setDefaultPoints}
          />
        }
      </div>
      <div className="flex w-full flex-row gap-2">
        <DailyForm.WeightField />
        {questType ? (
          ![`${Quest.Type.QWM}`, `${Quest.Type.QWS}`].includes(questType) && (
            <DailyForm.StreakTargetField />
          )
        ) : (
          <DailyForm.StreakTargetField />
        )}
      </div>
      {questType == Quest.Type.QR && (
        <div className="flex w-full flex-row gap-2">
          <DailyForm.TimeStartField
            setTimeStartAction={setTimeStart}
            timeStart={timeStart}
            timeStartErrors={timeStartErrors}
          />
          <DailyForm.TimeEndField
            setTimeEndAction={setTimeEnd}
            timeEnd={timeEnd}
            timeEndErrors={timeEndErrors}
          />
        </div>
      )}
      {questType && [`${Quest.Type.QWM}`, `${Quest.Type.QWS}`].includes(questType) && (
        <DailyForm.RequirementsField questType={questType} />
      )}
      {questType && [`${Quest.Type.QW}`, `${Quest.Type.QR}`].includes(questType) && (
        <DailyForm.DaysField days={days} setDaysAction={setDays} />
      )}
      <DailyForm.DescriptionField />
    </heroui.Form>
  );
}
