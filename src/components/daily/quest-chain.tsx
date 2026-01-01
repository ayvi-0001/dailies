"use client";

import * as React from "react";

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
import { Accordion, AccordionItem } from "@heroui/react";
import { ArrowBigLeftDash, ArrowBigUpDash, SwordsIcon } from "lucide-react";

import { invoke } from "@/lib/tauri";

import DailyCard from "./card";
import { Daily } from "./types";

export function QuestsHeader({ title }: { title: string }): React.ReactNode {
  return (
    <div
      className="bg-opacity-90 relative h-8 bg-[#6B6C76] bg-blend-overlay select-none"
      id="dailies-list-header"
    >
      <div className="flex flex-row items-center gap-2">
        <div className="box-content aspect-square size-8 place-items-center place-self-center bg-yellow-400 shadow-md">
          <SwordsIcon className="size-8 opacity-20" />
        </div>
        <p className="text-xl leading-none font-bold text-black text-shadow-sm">{title}</p>
      </div>
    </div>
  );
}

export type QuestChainProps = {
  userId: number;
  chain: string;
  dailies: Daily[];
  setDailiesAction: React.Dispatch<React.SetStateAction<Daily[]>>;
  totalWeight: number;
  onUpdateAction: () => void;
};

export function QuestChain(props: QuestChainProps): React.ReactElement {
  const { userId, chain, dailies, setDailiesAction, totalWeight, onUpdateAction } = props;

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

  return (
    <Accordion
      key={chain}
      fullWidth
      isCompact
      keepContentMounted
      // TODO(ayvi): make accordian for empty quest chains closed by default
      // http://ayvi:3000/ayvi/dailies/issues/129
      // defaultExpandedKeys={dailies.length > 0 ? [chain] : undefined}
      defaultExpandedKeys={[chain]}
      variant="splitted"
    >
      <AccordionItem
        key={chain}
        classNames={{
          base: "px-0 shadow-medium rounded-medium relative bg-transparent",
          startContent: "flex w-full items-center border-2 border-[#ece5d8] bg-[#2d3b4a]/70",
          indicator: "z-11 justify-self-start absolute ml-4",
          content: "bg-white/20 pl-3 pr-3 pt-4 pb-4",
          heading: "leading-none",
        }}
        id={`chain-${chain}`}
        indicator={({ isOpen }) =>
          isOpen ? <ArrowBigLeftDash size={20} /> : <ArrowBigUpDash size={20} />
        }
        startContent={<div className={"text-md ml-10 p-1 leading-5 text-white"}>{chain}</div>}
        textValue={chain}
      >
        <div className="flex flex-col items-center justify-center gap-4">
          <DndContext
            collisionDetection={closestCenter}
            sensors={sensors}
            onDragEnd={(event: DragEndEvent) =>
              handleDragEnd(event, userId!, chain, dailies, setDailiesAction)
            }
          >
            <SortableContext
              items={dailies.map(d => d.sequence) || []}
              strategy={verticalListSortingStrategy}
            >
              {dailies?.map(daily => (
                <SortableItem
                  key={`${daily.pointId}-${daily.sequence}`}
                  className="w-[100%] flex-shrink-0"
                  // @ts-expect-error: overwrite assigning number to id
                  id={daily.sequence}
                >
                  <DailyCard
                    daily={daily}
                    totalWeight={totalWeight}
                    userId={userId}
                    onRefreshAction={onUpdateAction}
                  />
                </SortableItem>
              ))}
            </SortableContext>
          </DndContext>
        </div>
      </AccordionItem>
    </Accordion>
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
