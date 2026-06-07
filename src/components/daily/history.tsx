import * as React from "react";

import * as heroui from "@heroui/react";
import * as RadixContextMenu from "@radix-ui/react-context-menu";
import * as ReactUse from "@reactuses/core";
import { CalendarDate, parseDate } from "@internationalized/date";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarCogIcon } from "lucide-react";

import { queryDailies } from "@/actions/query";
import { User } from "@/app/providers/user";
import { LOCAL_TZ, formatDateISO8601, formatDateTimeISO8601 } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { Option } from "@/types/option";

import CardBorder from "./border";
import { CardContent, CardStats, ContextMenuContent } from "./card";
import { isDailyEditable } from "./editability";
import EditModal from "./modals/edit";
import { updateDailyCallback } from "./providers/dailies";
import {
  DEFAULT_QUEST_TYPE_STYLES,
  QuestType,
  QuestTypeStyles,
  useQuestTypes,
} from "./providers/quest-types";
import type { Daily } from "./types";

type HistoryDrawerProps = {
  daily: Daily;
  isOpen: boolean;
  minutelyRefresh: Date;
  overrideEditable?: boolean;
  setHistoryIsOpenAction: React.Dispatch<React.SetStateAction<boolean>>;
  totalWeight: number;
  updateParentDaily: () => void;
  user: User;
};

export default function HistoryDrawer(props: HistoryDrawerProps): React.ReactElement {
  const {
    daily,
    isOpen,
    minutelyRefresh,
    overrideEditable,
    setHistoryIsOpenAction,
    totalWeight,
    updateParentDaily,
    user,
  } = props;

  const questAcceptedDate: CalendarDate = parseDate(daily.accepted.substring(0, 10));
  const dateRangeEnd: CalendarDate = parseDate(daily.date).subtract({ days: 1 });

  let dateRangeStart: CalendarDate = dateRangeEnd.subtract({ days: 6 });
  if (Math.sign(dateRangeStart.compare(questAcceptedDate)) === -1) {
    dateRangeStart = questAcceptedDate;
  }

  const [dateRange, setDateRange] = React.useState<Option<heroui.RangeValue<CalendarDate>>>({
    start: dateRangeStart,
    end: dateRangeEnd,
  });

  return (
    <heroui.Drawer
      hideCloseButton
      isDismissable
      isKeyboardDismissDisabled
      className="bg-black/85 select-none"
      isOpen={isOpen}
      placement="bottom"
      radius="none"
      size="2xl"
    >
      <heroui.DrawerContent>
        {(onClose) => (
          <div>
            <heroui.DrawerHeader className="flex place-self-center">
              <span className="text-[#f0f0ff] underline underline-offset-2">{daily.name}</span>
            </heroui.DrawerHeader>
            <heroui.DrawerBody>
              {Math.sign(dateRangeEnd.compare(dateRangeStart)) === -1 ? (
                <div className="place-self-center">
                  <p className="text-sm text-[#f0f0ff] italic opacity-60">No History</p>
                </div>
              ) : (
                <>
                  <heroui.DateRangePicker
                    aria-label="history date range picker"
                    className="dark mb-1 w-fit place-self-center"
                    classNames={{
                      inputWrapper: "w-fit",
                      segment:
                        "text-xs font-bold text-[#f0f0ff] transition-colors data-[editable=true]:text-[#f0f0ff] data-[editable=true]:focus:text-[#f0f0ff] data-[editable=true]:data-[placeholder=true]:text-[#f0f0ff]",
                      calendarContent: "dark",
                      popoverContent: "dark",
                      separator: "text-[#f0f0ff]",
                    }}
                    labelPlacement="outside"
                    maxValue={dateRangeEnd}
                    minValue={questAcceptedDate}
                    selectorIcon={<CalendarCogIcon size={18} stroke="#f0f0ff" />}
                    value={dateRange}
                    onChange={setDateRange}
                  />
                  <div>
                    <HistoryCards
                      daily={daily}
                      dateRange={dateRange}
                      minutelyRefresh={minutelyRefresh}
                      overrideEditable={overrideEditable}
                      totalWeight={totalWeight}
                      updateParentDaily={updateParentDaily}
                      user={user}
                    />
                  </div>
                  <p
                    className={cn(
                      "w-full text-[0.6rem] leading-none",
                      "tracking-tighter text-[#f0f0ff]",
                    )}
                  >{`Quest accepted: ${questAcceptedDate}`}</p>
                </>
              )}
            </heroui.DrawerBody>
            <heroui.DrawerFooter className="mt-4 mb-3 flex justify-center gap-2 leading-none">
              <heroui.Button
                color="danger"
                size="sm"
                variant="flat"
                onPress={(_: heroui.PressEvent) => {
                  setHistoryIsOpenAction(!history);
                  onClose();
                }}
              >
                Close
              </heroui.Button>
            </heroui.DrawerFooter>
          </div>
        )}
      </heroui.DrawerContent>
    </heroui.Drawer>
  );
}

type HistoryCardsProps = {
  daily: Daily;
  dateRange: Option<heroui.RangeValue<CalendarDate>>;
  minutelyRefresh: Date;
  overrideEditable?: boolean;
  totalWeight: number;
  updateParentDaily: () => void;
  user: User;
};

export function HistoryCards(props: HistoryCardsProps): React.ReactElement {
  const {
    daily,
    dateRange,
    minutelyRefresh,
    overrideEditable,
    totalWeight,
    updateParentDaily,
    user,
  } = props;

  const questTypes: QuestType[] = useQuestTypes();

  const [dailies, setDailies] = React.useState<Daily[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [countRefreshDailies, setCountRefreshDailies] = React.useState<number>(0);

  ReactUse.useOnceEffect(() => setIsLoading(true), [dateRange]);

  ReactUse.useOnceEffect(() => {
    queryDailies({
      user: user.name,
      quest_id: daily.questId,
      end_date: formatDateTimeISO8601(dateRange!.end.toDate(LOCAL_TZ)).substring(0, 10),
      start_date: formatDateTimeISO8601(dateRange!.start.toDate(LOCAL_TZ)).substring(0, 10),
    })
      .andTee((result) => setDailies(result))
      .then(() => setIsLoading(false));
  }, [user, countRefreshDailies, dateRange]);

  const triggerRefreshDailies = React.useCallback(
    async () => setCountRefreshDailies((c) => c + 1),
    [],
  );

  const updateDaily = React.useCallback(
    (daily: Daily, patch: Partial<Daily>) => {
      updateParentDaily();
      updateDailyCallback(
        user.name,
        parseDate(daily.date),
        daily,
        patch,
        setDailies,
        null,
        new Set([
          "points", // recalculate weighted points/total weight
          "weight", // recalculate weighted points/total weight
          "archived", // recalculate total weight
        ]),
        triggerRefreshDailies,
      );
    },
    [user, updateParentDaily, triggerRefreshDailies],
  );

  return (
    <heroui.ScrollShadow
      hideScrollBar
      className="flex h-[calc(100vh-60vh)] w-full flex-col gap-2 rounded-md"
      offset={80}
      size={10}
      style={{ scrollbarWidth: "none" }}
    >
      <React.Suspense>
        {isLoading ? (
          <div className="flex min-h-full min-w-full justify-center">
            <heroui.Spinner color="secondary" variant="wave" />
          </div>
        ) : (
          dailies.map((daily: Daily, index: number) => (
            <div key={`${daily.pointId}-${index}`} className="mx-2">
              <HistoryDailyCard
                daily={daily}
                index={index}
                minutelyRefresh={minutelyRefresh}
                parentOverrideEditable={overrideEditable}
                questTypes={questTypes}
                totalWeight={totalWeight}
                updateDailyAction={updateDaily}
                user={user}
              />
            </div>
          ))
        )}
      </React.Suspense>
    </heroui.ScrollShadow>
  );
}

type HistoryDailyCardProps = {
  daily: Daily;
  index: number;
  minutelyRefresh: Date;
  parentOverrideEditable?: boolean;
  questTypes: QuestType[];
  totalWeight: number;
  updateDailyAction: (daily: Daily, patch: Partial<Daily>) => void;
  user: User;
};

export function HistoryDailyCard(props: HistoryDailyCardProps): React.ReactElement {
  const {
    daily,
    index,
    minutelyRefresh,
    parentOverrideEditable,
    questTypes,
    totalWeight,
    updateDailyAction,
    user,
  } = props;

  const questType: Option<QuestType> =
    questTypes.find((type) => `${type.id}` == `${daily.type}`) || null;
  const questTypeStyles: QuestTypeStyles = questType?.styles || DEFAULT_QUEST_TYPE_STYLES;

  const [points, setPoints] = React.useState<Option<string>>(
    daily.points !== null ? `${daily.points}` : null,
  );
  const editDisclosure = ReactUse.useDisclosure();
  const { value: contextMenuOpen, toggle: toggleContextMenu } = ReactUse.useBoolean();

  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  React.useEffect(() => setIsLoading(false), [daily]);

  const isEditable: boolean = React.useMemo(
    () => isDailyEditable(daily, minutelyRefresh),
    [daily, minutelyRefresh],
  );

  return (
    <>
      <RadixContextMenu.Root modal onOpenChange={toggleContextMenu}>
        <RadixContextMenu.Trigger className="flex">
          <CardBorder
            daily={daily}
            divProps={{ className: questTypeStyles.borderClass as string }}
            isEditable={parentOverrideEditable ?? isEditable}
            minutelyRefresh={minutelyRefresh}
          >
            <AnimatePresence>
              <motion.div
                key={`card-effect-${daily.pointId}`}
                animate={isLoading ? { opacity: 0 } : {}}
                className="flex w-full min-w-0 flex-row justify-between gap-2 p-1"
                initial={isLoading ? { opacity: 100 } : {}}
                transition={
                  isLoading
                    ? { duration: 0.6, repeat: Infinity, repeatType: "reverse" }
                    : { duration: 0, repeat: 0 }
                }
              >
                <CardContent
                  daily={daily}
                  descriptionContent="note"
                  name={formatDateISO8601(daily.date)}
                  questType={questType}
                  questTypeStyles={questTypeStyles}
                />
                <CardStats
                  daily={daily}
                  disabled={parentOverrideEditable ? false : !isEditable}
                  points={points}
                  setPointsAction={setPoints}
                  totalWeight={totalWeight}
                  updateDailyAction={updateDailyAction}
                />
              </motion.div>
            </AnimatePresence>
          </CardBorder>
        </RadixContextMenu.Trigger>
        <RadixContextMenu.Portal>
          <AnimatePresence>
            {contextMenuOpen && (
              <ContextMenuContent
                daily={daily}
                editOnOpenAction={editDisclosure.onOpen}
                isEditable={isEditable}
                setPointsAction={setPoints}
                updateDailyAction={updateDailyAction}
                userId={user.id}
              />
            )}
          </AnimatePresence>
        </RadixContextMenu.Portal>
      </RadixContextMenu.Root>
      {editDisclosure.isOpen && (
        <EditModal
          key={`${daily.pointId}-${index}`}
          historic
          daily={daily}
          disclosure={editDisclosure}
          setIsLoadingAction={setIsLoading}
          title={`${daily.name} (${daily.date})`}
          updateDailyAction={updateDailyAction}
          user={user}
        />
      )}
    </>
  );
}
