"use client";

import * as React from "react";

import * as heroui from "@heroui/react";
import * as ReactUse from "@reactuses/core";
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  UniqueIdentifier,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { today } from "@internationalized/date";
import { CalendarDate, CalendarDateTime, DateValue, ZonedDateTime } from "@internationalized/date";
import clsx from "clsx";
import { HTMLMotionProps } from "framer-motion";
import {
  ArrowBigLeftDash,
  ArrowBigUpDash,
  CalendarCogIcon,
  ListChevronsDownUpIcon,
  ListChevronsUpDownIcon,
  ListFilterIcon,
  ScrollTextIcon,
} from "lucide-react";

import { User } from "@/app/providers/user";
import { LOCAL_TZ } from "@/lib/dates";
import { invoke } from "@/lib/tauri";
import { Option } from "@/types/option";

import DailyCard from "./card";
import { Daily } from "./types";

type QuestsHeaderProps = {
  isAllQuestChainsCollapsed: boolean;
  isArchivedQuestsFiltered: boolean;
  isCompletedQuestsFiltered: boolean;
  isOptionalQuestsFiltered: boolean;
  listDate: DateValue;
  questNameFilterText: string;
  setArchivedQuestsFilteredAction: (value: boolean) => Promise<void>;
  setCompletedQuestsFilteredAction: (value: boolean) => Promise<void>;
  setIsAllQuestChainCollapsedAction: (value: boolean) => Promise<void>;
  setListDateAction: React.Dispatch<React.SetStateAction<CalendarDate>>;
  setOptionalQuestsFilteredAction: (value: boolean) => Promise<void>;
  setQuestNameFilterTextAction: (value: string) => Promise<void>;
  title: string;
};

export function QuestsHeader(props: QuestsHeaderProps): React.ReactNode {
  const {
    isAllQuestChainsCollapsed,
    isArchivedQuestsFiltered,
    isCompletedQuestsFiltered,
    isOptionalQuestsFiltered,
    listDate,
    questNameFilterText,
    setArchivedQuestsFilteredAction,
    setCompletedQuestsFilteredAction,
    setIsAllQuestChainCollapsedAction,
    setListDateAction,
    setOptionalQuestsFilteredAction,
    setQuestNameFilterTextAction,
    title,
  } = props;

  return (
    <div
      className="bg-opacity-60 relative mx-2 h-9 bg-slate-400/80 bg-blend-overlay select-none"
      id="dailies-list-header"
    >
      <div className="flex flex-row items-center justify-items-stretch gap-2">
        <div className="box-content flex aspect-square size-9 place-items-center justify-items-center bg-yellow-400 shadow-md">
          <ScrollTextIcon className="size-8 w-full opacity-20" />
        </div>
        <div className="flex grow">
          <p className="text-xl leading-none font-bold text-black text-shadow-md">{title}</p>
        </div>
        <div className="mr-2 flex flex-row">
          <QuestListDatePicker listDate={listDate} setListDateAction={setListDateAction} />
          <QuestCollapseButton
            isAllQuestChainsCollapsed={isAllQuestChainsCollapsed}
            setIsAllQuestChainCollapsedAction={setIsAllQuestChainCollapsedAction}
          />
          <QuestsFilterMenu
            isArchivedQuestsFiltered={isArchivedQuestsFiltered}
            isCompletedQuestsFiltered={isCompletedQuestsFiltered}
            isOptionalQuestsFiltered={isOptionalQuestsFiltered}
            nameFilterText={questNameFilterText}
            setArchivedQuestsFilteredAction={setArchivedQuestsFilteredAction}
            setCompletedQuestsFilteredAction={setCompletedQuestsFilteredAction}
            setOptionalQuestsFilteredAction={setOptionalQuestsFilteredAction}
            setQuestNameFilterTextAction={setQuestNameFilterTextAction}
          />
        </div>
      </div>
    </div>
  );
}

export type QuestChainProps = {
  chain: string;
  dailies: Daily[];
  isAllQuestChainsCollapsed: boolean;
  isDailyFilteredAction: (daily: Daily) => Option<Daily>;
  minutelyRefresh: Date;
  setDailiesAction: React.Dispatch<React.SetStateAction<Daily[]>>;
  totalWeight: number;
  updateDaily: (pointId: string, patch: Partial<Daily>) => void;
  user: User;
};

const MemoizedQuestChain = React.memo(QuestChain);
export default MemoizedQuestChain;

function QuestChain(props: QuestChainProps): React.ReactElement {
  const {
    chain,
    dailies,
    isAllQuestChainsCollapsed,
    isDailyFilteredAction,
    minutelyRefresh,
    setDailiesAction,
    totalWeight,
    updateDaily,
    user,
  } = props;

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const [isQuestChainCollapsed, setIsQuestChainCollapsed] = React.useState<boolean>(false);
  const [selectedKeys, setSelectedKeys] = React.useState<heroui.Selection>(new Set([]));

  const setSelectedKeysAction = React.useCallback(
    async (keys: heroui.Selection): Promise<void> => {
      if (keys != "all" && keys?.size === 0) {
        await invoke<boolean>("set_quest_chain_collapsed", {
          user_id: user.id,
          chain: chain,
          value: true,
        });
        setIsQuestChainCollapsed(true);
      } else {
        await invoke<boolean>("set_quest_chain_collapsed", {
          user_id: user.id,
          chain: chain,
          value: false,
        });
        setIsQuestChainCollapsed(false);
      }
      setSelectedKeys(keys);
    },
    [chain, user],
  );

  ReactUse.useOnceEffect(() => {
    const get_collapsed = async () => {
      await invoke<boolean>("get_quest_chain_collapsed", {
        user_id: user.id,
        chain: chain,
      }).then(result => {
        setIsQuestChainCollapsed(result);
        if (result) setSelectedKeys(new Set([]));
        else setSelectedKeys(new Set([chain]));
      });
    };

    if (isAllQuestChainsCollapsed) setSelectedKeys(new Set([]));
    else get_collapsed();
  }, [isAllQuestChainsCollapsed, user.id, chain, isQuestChainCollapsed]);

  // let questChainCompletion: Option<number> =
  //   filteredDailies.map(d => d.points || 0).reduce((sum, current) => sum + current, 0) /
  //   filteredDailies.map(d => d.total || 0).reduce((sum, current) => sum + current, 0);

  // if (!Number.isNaN(questChainCompletion)) {
  //   questChainCompletion = roundTo(questChainCompletion * 100, 2);
  // } else {
  //   questChainCompletion = null;
  // }

  return (
    <heroui.Accordion
      key={chain}
      fullWidth
      isCompact
      // TODO(ayvi): might cause issues with resize observer,
      // set false or upgrade heroui/react to where patch is applied.
      keepContentMounted
      selectedKeys={selectedKeys}
      variant="splitted"
      onSelectionChange={React.useCallback(
        (keys: heroui.Selection) => setSelectedKeysAction(keys),
        [setSelectedKeysAction],
      )}
    >
      <heroui.AccordionItem
        key={chain}
        classNames={{
          base: "px-0 shadow-medium rounded-medium relative bg-transparent items-center",
          startContent:
            "flex max-w-full min-w-full items-center border-3 border-[#ece5d8] bg-[#2d3b4a]/70",
          indicator: "z-11 justify-self-start absolute ml-4",
          content: "bg-white/20 py-4 place-content-center px-4",
          heading: "leading-none",
        }}
        id={`chain-${chain}`}
        indicator={({ isOpen }) =>
          isOpen ? (
            <ArrowBigLeftDash
              className="z-11"
              fill={clsx(!isQuestChainCollapsed && isAllQuestChainsCollapsed && "#005f5a")}
              size={20}
            />
          ) : (
            <ArrowBigUpDash
              className="z-11"
              fill={clsx(
                isQuestChainCollapsed && isAllQuestChainsCollapsed && "#372aac",
                isQuestChainCollapsed && !isAllQuestChainsCollapsed && "#372aac",
              )}
              size={20}
            />
          )
        }
        startContent={
          <div
            className={
              "text-md mr-3 ml-10 flex w-full flex-row items-center justify-between p-1 leading-5 text-white"
            }
          >
            <span>{chain}</span>
            {/* <span className="ml-1 text-xs font-bold text-[#f0f0ff] opacity-80">
              {questChainCompletion !== null && `[${questChainCompletion.toFixed(2)}%]`}
            </span> */}
          </div>
        }
        textValue={chain}
      >
        <div className="flex flex-col items-center justify-center gap-4">
          <DndContext
            collisionDetection={closestCenter}
            sensors={sensors}
            onDragEnd={React.useCallback(
              (event: DragEndEvent) =>
                handleDragEnd(event, user.id, chain, dailies, setDailiesAction),
              [chain, dailies, setDailiesAction, user],
            )}
          >
            <SortableContext
              items={dailies.map(d => d.sequence)}
              strategy={verticalListSortingStrategy}
            >
              {dailies
                .filter(daily => isDailyFilteredAction(daily))
                .map(daily => (
                  <SortableItem
                    key={`${daily.pointId}-${daily.sequence}`}
                    className="max-w-full min-w-full flex-shrink-0"
                    id={`${daily.name}-${daily.sequence}`}
                  >
                    <DailyCard
                      daily={daily}
                      minutelyRefresh={minutelyRefresh}
                      totalWeight={totalWeight}
                      updateDaily={updateDaily}
                      user={user}
                    />
                  </SortableItem>
                ))}
            </SortableContext>
          </DndContext>
        </div>
      </heroui.AccordionItem>
    </heroui.Accordion>
  );
}

enum SortDirection {
  Up = "up",
  Down = "down",
}

function handleDragEnd(
  event: DragEndEvent,
  userId: number,
  chain: string,
  dailies: Daily[],
  setDailies: React.Dispatch<React.SetStateAction<Daily[]>>,
) {
  const { active, over } = event;
  const activeId: number = +`${active.id}`;
  const overId: number = +`${over!.id}`;
  const activeQuest = dailies.find(d => d.chain == chain && d.sequence == activeId)!;

  const activeIndex = +`${active?.data.current!.sortable.index}`;
  const overIndex = +`${over?.data.current!.sortable.index}`;
  const shiftDirection =
    Math.sign(activeIndex - overIndex) == 1 ? SortDirection.Up : SortDirection.Down;

  if (active.id !== over?.id) {
    invoke("update_sequence", {
      user_id: userId,
      chain: chain,
      quest_id: activeQuest.questId,
      sequence: +`${over!.id}`,
      sort_direction: shiftDirection,
    });

    setDailies(items => {
      items = arrayMove(
        items,
        items.indexOf(activeQuest),
        items.findIndex(daily => daily.chain == chain && daily.sequence == overId),
      );

      return items.map(daily => {
        if (dailies.map(d => d.questId).includes(daily.questId)) {
          const sortedDaily = Object.assign({}, daily);

          if (sortedDaily.questId == activeQuest.questId) {
            sortedDaily.sequence = overId;
          } else {
            switch (shiftDirection) {
              case SortDirection.Down: {
                if (sortedDaily.sequence > activeId && sortedDaily.sequence <= overId) {
                  sortedDaily.sequence -= 1;
                }
              }
              case SortDirection.Up: {
                if (sortedDaily.sequence >= overId && sortedDaily.sequence < activeId) {
                  sortedDaily.sequence += 1;
                }
              }
            }
          }
          return sortedDaily;
        }
        return daily;
      });
    });
  }
}

export function SortableItem(props: React.ComponentProps<"div">): React.ReactElement {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: props.id as UniqueIdentifier,
    animateLayoutChanges: () => false,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} className={props.className} style={style} {...attributes} {...listeners}>
      {props.children}
    </div>
  );
}

const motionProps: Omit<HTMLMotionProps<"div">, "ref"> = {
  variants: {
    exit: { opacity: 0, transition: { duration: 0.1, ease: "easeIn" } },
    enter: { opacity: 1, transition: { duration: 0.15, ease: "easeOut" } },
  },
};

type QuestListDatePickerProps = {
  listDate: DateValue;
  setListDateAction: React.Dispatch<React.SetStateAction<CalendarDate>>;
};

function QuestListDatePicker(props: QuestListDatePickerProps): React.ReactElement {
  const { listDate, setListDateAction } = props;
  const currentDate = today(LOCAL_TZ);

  return (
    <heroui.DatePicker
      aria-label="quest list date picker"
      className="dark"
      classNames={{
        inputWrapper: "w-fit bg-transparent hover:bg-transparent focus-within:hover:bg-transparent",
        segment:
          "text-xs font-bold text-black transition-colors focus:bg-slate-900/40 data-[editable=true]:text-black data-[editable=true]:focus:text-black data-[editable=true]:data-[placeholder=true]:text-black",
        calendarContent: "dark",
        popoverContent: "dark",
      }}
      granularity="day"
      maxValue={currentDate}
      minValue={undefined /* TODO(ayvi): set to earliest day for user */}
      popoverProps={{ size: "sm" }}
      radius="none"
      selectorButtonProps={{ size: "sm", isIconOnly: true, variant: "light" }}
      selectorIcon={
        <CalendarCogIcon
          size={18}
          stroke={clsx(
            listDate.compare(currentDate) !== 0 && "#000000",
            listDate.compare(currentDate) === 0 && "#fcc800",
          )}
        />
      }
      size="sm"
      value={listDate}
      variant="flat"
      onChange={(value: CalendarDate | CalendarDateTime | ZonedDateTime | null) =>
        value && setListDateAction(value as CalendarDate)
      }
    />
  );
}

type QuestCollapseButtonProps = {
  isAllQuestChainsCollapsed: boolean;
  setIsAllQuestChainCollapsedAction: (value: boolean) => Promise<void>;
};

function QuestCollapseButton(props: QuestCollapseButtonProps): React.ReactElement {
  const { isAllQuestChainsCollapsed, setIsAllQuestChainCollapsedAction } = props;

  return (
    <heroui.Button
      isIconOnly
      className="box-content flex aspect-square"
      radius="sm"
      size="sm"
      variant="light"
      onPress={(_event: heroui.PressEvent) =>
        setIsAllQuestChainCollapsedAction(!isAllQuestChainsCollapsed)
      }
    >
      {isAllQuestChainsCollapsed ? (
        <heroui.Tooltip
          classNames={{ base: "dark", content: "text-xs text-white" }}
          closeDelay={0}
          content="Expand"
          delay={0}
          motionProps={motionProps}
          offset={3}
          showArrow={true}
        >
          <ListChevronsUpDownIcon size="18" />
        </heroui.Tooltip>
      ) : (
        <heroui.Tooltip
          classNames={{ base: "dark", content: "text-xs text-white" }}
          closeDelay={0}
          content="Collapse"
          delay={0}
          motionProps={motionProps}
          offset={3}
          showArrow={true}
        >
          <ListChevronsDownUpIcon size="18" />
        </heroui.Tooltip>
      )}
    </heroui.Button>
  );
}

type QuestsFilterProps = {
  isArchivedQuestsFiltered: boolean;
  isCompletedQuestsFiltered: boolean;
  isOptionalQuestsFiltered: boolean;
  setArchivedQuestsFilteredAction: (value: boolean) => Promise<void>;
  setCompletedQuestsFilteredAction: (value: boolean) => Promise<void>;
  setOptionalQuestsFilteredAction: (value: boolean) => Promise<void>;
  nameFilterText: string;
  setQuestNameFilterTextAction: (value: string) => Promise<void>;
};

function QuestsFilterMenu(props: QuestsFilterProps): React.ReactElement {
  const {
    isArchivedQuestsFiltered,
    isCompletedQuestsFiltered,
    isOptionalQuestsFiltered,
    setArchivedQuestsFilteredAction,
    setCompletedQuestsFilteredAction,
    setOptionalQuestsFilteredAction,
    nameFilterText,
    setQuestNameFilterTextAction: setNameFilterTextAction,
  } = props;

  return (
    <heroui.Dropdown
      className="dark relative z-100 mr-3 max-w-fit min-w-fit rounded-none bg-gray-900/90 p-2"
      closeOnSelect={false}
    >
      <heroui.DropdownTrigger>
        <heroui.Button
          isIconOnly
          className="box-content flex aspect-square"
          radius="sm"
          size="sm"
          variant="light"
        >
          <heroui.Tooltip
            classNames={{ base: "dark", content: "text-xs text-white" }}
            closeDelay={0}
            content="Filter"
            delay={0}
            motionProps={motionProps}
            offset={3}
            showArrow={true}
          >
            <ListFilterIcon size="18" />
          </heroui.Tooltip>
        </heroui.Button>
      </heroui.DropdownTrigger>
      <heroui.DropdownMenu aria-label="Static Actions" className="w-fit">
        <heroui.DropdownItem
          key="name"
          classNames={{ title: "text-xs text-white" }}
          textValue="name filter"
        >
          <heroui.Input
            isClearable
            className="dark"
            classNames={{ input: "text-xs" }}
            placeholder="Quest Name"
            size="sm"
            value={nameFilterText}
            onValueChange={setNameFilterTextAction}
          ></heroui.Input>
        </heroui.DropdownItem>
        <heroui.DropdownItem
          key="archived"
          classNames={{ title: "text-xs text-white" }}
          textValue="archived toggle"
        >
          <heroui.Switch
            classNames={{ label: "text-xs text-white" }}
            isSelected={!isArchivedQuestsFiltered}
            size="sm"
            onValueChange={async (isSelected: boolean) =>
              await setArchivedQuestsFilteredAction(!isSelected)
            }
          >
            Archived
          </heroui.Switch>
        </heroui.DropdownItem>
        <heroui.DropdownItem
          key="completed"
          classNames={{ title: "text-xs text-white" }}
          textValue="completed toggle"
        >
          <heroui.Switch
            classNames={{ label: "text-xs text-white" }}
            isSelected={!isCompletedQuestsFiltered}
            size="sm"
            onValueChange={async (isSelected: boolean) =>
              await setCompletedQuestsFilteredAction(!isSelected)
            }
          >
            Completed
          </heroui.Switch>
        </heroui.DropdownItem>
        <heroui.DropdownItem
          key="optional"
          classNames={{ title: "text-xs text-white" }}
          textValue="optional toggle"
        >
          <heroui.Switch
            classNames={{ label: "text-xs text-white" }}
            isSelected={!isOptionalQuestsFiltered}
            size="sm"
            onValueChange={async (isSelected: boolean) =>
              await setOptionalQuestsFilteredAction(!isSelected)
            }
          >
            Optional
          </heroui.Switch>
        </heroui.DropdownItem>
      </heroui.DropdownMenu>
    </heroui.Dropdown>
  );
}
