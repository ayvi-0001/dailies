import * as React from "react";

import * as heroui from "@heroui/react";
import * as RadixContextMenu from "@radix-ui/react-context-menu";
import * as ReactUse from "@reactuses/core";
import { CalendarDate, parseDate } from "@internationalized/date";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarCogIcon } from "lucide-react";
import { ReadonlyURLSearchParams, useSearchParams } from "next/navigation";

import { cachedQueryQuestHistory } from "@/actions/query";
import { User } from "@/app/providers/user";
import { formatDateISO8601 } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { Option } from "@/types/option";

import CardBorder from "./border";
import { CardContent, CardStats, ContextMenuContent } from "./card";
import EditModal from "./modals/edit";
import {
  DEFAULT_QUEST_TYPE_STYLES,
  QuestType,
  QuestTypeStyles,
  useQuestTypes,
} from "./providers/quest-types";
import type { Daily } from "./types";

type HistoryDrawerProps = {
  user: User;
  isOpen: boolean;
  setHistoryIsOpenAction: React.Dispatch<React.SetStateAction<boolean>>;
  daily: Daily;
  totalWeight: number;
};

export default function HistoryDrawer(props: HistoryDrawerProps): React.ReactElement {
  const { user, isOpen, setHistoryIsOpenAction, daily, totalWeight } = props;

  const searchParams: ReadonlyURLSearchParams = useSearchParams();

  const questAcceptedDate: CalendarDate = parseDate(daily.accepted.substring(0, 10));
  const dateParam: CalendarDate = parseDate(searchParams.get("date") as string);
  const dateRangeEnd: CalendarDate = dateParam.subtract({ days: 1 });

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
      className="border-1 border-[#f0f0ff]/80 bg-black/85 select-none"
      isOpen={isOpen}
      placement="bottom"
      radius="none"
      size="2xl"
    >
      <heroui.DrawerContent>
        {onClose => (
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
                      totalWeight={totalWeight}
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
  totalWeight: number;
  user: User;
};

// TODO(ayvi): infinite scroll history http://ayvi:3000/ayvi/dailies/issues/33
export function HistoryCards(props: HistoryCardsProps): React.ReactElement {
  const { daily, dateRange, totalWeight, user } = props;

  const questTypes: QuestType[] = useQuestTypes();

  const [dailies, setDailies] = React.useState<Daily[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [countRefreshDailies, setCountRefreshDailies] = React.useState<number>(0);

  ReactUse.useOnceEffect(() => {
    setIsLoading(true);
  }, [dateRange]);

  React.useEffect(() => {
    const query_dailies = async (): Promise<void> => {
      const dailies = await cachedQueryQuestHistory(
        user.name,
        daily.questId,
        dateRange!.start,
        dateRange!.end,
      );
      setDailies(dailies);
      setIsLoading(false);
    };
    query_dailies();
  }, [daily, user, countRefreshDailies, dateRange]);

  const triggerRefreshDailies: () => void = React.useCallback(() => {
    console.debug(`countRefreshDailies=${countRefreshDailies}`);
    setCountRefreshDailies(countRefreshDailies + 1);
  }, [countRefreshDailies]);

  return (
    <heroui.ScrollShadow
      hideScrollBar
      className="h-[calc(100vh-60vh)] rounded-md"
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
            <div key={`${daily.pointId}-${index}`} className="mr-2 mb-4 ml-2">
              <HistoryDailyCard
                daily={daily}
                index={index}
                questTypes={questTypes}
                totalWeight={totalWeight}
                user={user}
                onRefreshAction={triggerRefreshDailies}
              />
            </div>
          ))
        )}
      </React.Suspense>
    </heroui.ScrollShadow>
  );
}

type HistoryDailyCardProps = {
  user: User;
  daily: Daily;
  index: number;
  questTypes: QuestType[];
  totalWeight: number;
  onRefreshAction: () => void;
};

export function HistoryDailyCard(props: HistoryDailyCardProps): React.ReactElement {
  const { user, daily, index, questTypes, totalWeight, onRefreshAction } = props;

  const questType: Option<QuestType> =
    questTypes.find(type => `${type.id}` == `${daily.type}`) || null;
  const questTypeStyles: QuestTypeStyles = questType?.styles || DEFAULT_QUEST_TYPE_STYLES;

  const [points, setPoints] = React.useState<Option<string>>(
    daily.points !== null ? `${daily.points}` : null,
  );
  const { isOpen, onOpen, onOpenChange } = heroui.useDisclosure();
  const { value: contextMenuOpen, toggle: toggleContextMenu } = ReactUse.useBoolean();

  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  React.useEffect(() => setIsLoading(false), [daily]);

  return (
    <>
      <RadixContextMenu.Root modal onOpenChange={toggleContextMenu}>
        <RadixContextMenu.Trigger className="flex items-center justify-center">
          <CardBorder daily={daily} divProps={{ className: questTypeStyles.borderClass as string }}>
            <motion.div
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
                points={points}
                setPointsAction={setPoints}
                totalWeight={totalWeight}
                onRefreshAction={() => {
                  setIsLoading(true);
                  onRefreshAction();
                }}
              />
            </motion.div>
          </CardBorder>
        </RadixContextMenu.Trigger>
        <RadixContextMenu.Portal>
          <AnimatePresence>
            {contextMenuOpen && (
              <ContextMenuContent
                daily={daily}
                editOnOpenAction={onOpen}
                setPointsAction={setPoints}
                onRefreshAction={onRefreshAction}
              />
            )}
          </AnimatePresence>
        </RadixContextMenu.Portal>
      </RadixContextMenu.Root>
      <EditModal
        key={`${daily.pointId}-${index}`}
        historic
        daily={daily}
        isOpen={isOpen}
        setIsLoadingAction={setIsLoading}
        title={`${daily.name} (${daily.date})`}
        user={user}
        onOpenChange={onOpenChange}
      />
    </>
  );
}
