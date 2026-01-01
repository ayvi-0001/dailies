import * as React from "react";

import * as heroui from "@heroui/react";
import { Time, parseDateTime } from "@internationalized/date";
import { DateValue } from "@internationalized/date";
import { parseTime } from "@internationalized/date";

import type { Option } from "@/types/option";

import * as DailyForm from "./fields";
import { DailiesState, Daily, Quest, useDailies } from "../../daily";
import { QuestType, useQuestTypes } from "../providers/quest-types";

type EditDailyFormProps = {
  daily: Daily;
  formRef: React.RefObject<Option<HTMLFormElement>>;
  dispatch: (payload: FormData) => void;
  historic?: boolean;
  onSubmit: () => void;
};

export default function EditDailyForm(props: EditDailyFormProps): React.ReactElement {
  const { daily, formRef, dispatch, historic, onSubmit } = props;

  const dailiesState: DailiesState = useDailies();
  const questTypes: QuestType[] = useQuestTypes();

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

  const [total, setTotal] = React.useState<number>(daily.total);
  const [defaultPoints, setDefaultPoints] = React.useState<number>(daily.defaultPoints);
  const defaultPointsErrors: React.ReactNode[] = [];
  if (total && defaultPoints && defaultPoints > total)
    defaultPointsErrors.push("Default points cannot be greater than total points.");

  const [archivedDate, setArchivedDate] = React.useState<Option<DateValue>>(null);

  const [days, setDays] = React.useState<string[]>([]);

  React.useEffect(() => {
    setName(daily?.name || "");
    setDays(daily?.days?.map(v => `${v}`) || []);
    setArchivedDate(daily?.archived ? parseDateTime(daily.archived.toString()) : null);
    setQuestType(daily?.type);
    setTotal(daily?.total);
    setDefaultPoints(daily?.defaultPoints);
    setTimeStart(daily?.timeStart ? parseTime(daily!.timeStart) : null);
    setTimeEnd(daily?.timeEnd ? parseTime(daily!.timeEnd) : null);
  }, [daily]);

  return (
    <heroui.Form
      ref={formRef}
      action={dispatch}
      autoCapitalize="off"
      autoComplete="off"
      validationBehavior="native"
      onSubmit={onSubmit}
    >
      {!historic && (
        <DailyForm.NameField name={name} nameErrors={nameErrors} setNameAction={setName} />
      )}
      {!historic && (
        <DailyForm.TypeField
          daily={daily}
          questType={questType}
          questTypes={questTypes}
          setQuestTypesAction={setQuestType}
        />
      )}
      {!historic && <DailyForm.ChainField daily={daily} questChains={dailiesState.questChains} />}
      <div className="flex w-full flex-row gap-3">
        <DailyForm.TotalField setTotalAction={setTotal} total={total} />
        {!historic && (
          <DailyForm.DefaultPointsField
            defaultPoints={defaultPoints}
            defaultPointsErrors={defaultPointsErrors}
            setDefaultPointsAction={setDefaultPoints}
          />
        )}
      </div>
      <div className="flex w-full flex-row gap-3">
        <DailyForm.WeightField daily={daily} />
        <DailyForm.StreakTargetField daily={daily} />
      </div>
      <div className="flex w-full flex-row gap-3">
        {!historic && questType == Quest.Type.QR && (
          <DailyForm.TimeStartField
            setTimeStartAction={setTimeStart}
            timeStart={timeStart}
            timeStartErrors={timeStartErrors}
          />
        )}
        {!historic && questType == Quest.Type.QR && (
          <DailyForm.TimeEndField
            setTimeEndAction={setTimeEnd}
            timeEnd={timeEnd}
            timeEndErrors={timeEndErrors}
          />
        )}
      </div>
      {questType && [`${Quest.Type.QWM}`, `${Quest.Type.QWS}`].includes(questType) && (
        <DailyForm.RequirementsField daily={daily} />
      )}
      {!historic && questType && [`${Quest.Type.QW}`, `${Quest.Type.QR}`].includes(questType) && (
        <DailyForm.DaysField days={days} setDaysAction={setDays} />
      )}
      {!historic && <DailyForm.DescriptionField daily={daily} />}
      {!historic && (
        <DailyForm.ArchivedField
          archivedDate={archivedDate}
          setArchivedDateAction={setArchivedDate}
        />
      )}
    </heroui.Form>
  );
}
