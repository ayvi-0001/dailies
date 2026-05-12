"use client";

import * as React from "react";

import * as heroui from "@heroui/react";
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import { DailiesState, QuestChain, useDailies } from "@/components/daily";
import { SortDirection, SortableItem } from "@/components/daily/quest-chain";
import { invoke } from "@/lib/tauri";
import { Option } from "@/types/option";

import SearchParamModal from "./modal";

export default function Modal(): React.ReactElement {
  const dailiesState: DailiesState = useDailies();

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

  const onDragEnd = React.useCallback(
    (event: DragEndEvent) =>
      handleDragEnd(event, dailiesState.questChains, dailiesState.setQuestChains),
    [dailiesState.questChains, dailiesState.setQuestChains],
  );

  return (
    <SearchParamModal
      modalContentAction={(moveProps, closeModal) =>
        function modalContent() {
          return (
            <>
              <heroui.ModalHeader {...moveProps} className="text-md justify-self-center">
                Quest Chains
              </heroui.ModalHeader>
              <heroui.ModalBody className="h-fit w-full overflow-hidden bg-black/90 text-white">
                <DndContext
                  collisionDetection={closestCenter}
                  sensors={sensors}
                  onDragEnd={(event: DragEndEvent) => onDragEnd(event)}
                >
                  <SortableContext
                    items={dailiesState.questChains.map(questChain => questChain.sequence)}
                    strategy={verticalListSortingStrategy}
                  >
                    {dailiesState.questChains.map((value, idx) => (
                      <SortableItem
                        key={`${value.chain}-${value.sequence}`}
                        className="max-w-full min-w-full flex-shrink-0"
                        // @ts-expect-error: overwrite assigning number to id - req for onDragEnd
                        id={value.sequence}
                      >
                        <div
                          key={idx}
                          className="flex w-full justify-center border-2 border-[#ece5d8] bg-[#2d3b4a]/70 px-2 py-1 font-bold"
                        >
                          {value.chain}
                        </div>
                      </SortableItem>
                    ))}
                  </SortableContext>
                </DndContext>
              </heroui.ModalBody>
              <heroui.ModalFooter className="flex flex-col justify-center">
                <heroui.Button color="danger" size="sm" variant="light" onPress={closeModal}>
                  Close
                </heroui.Button>
              </heroui.ModalFooter>
            </>
          );
        }
      }
      modalContentProps={{ className: "flex border-1 border-gray-600 bg-black/95" }}
      modalProps={{ className: "dark w-9/10 text-[#f0f0ff]" }}
      searchParamKey="modal"
    />
  );
}

type UpdateQuestChainSequenceInvokeArgs = {
  quest_chains: QuestChain[];
};

function handleDragEnd(
  event: DragEndEvent,
  questChains: QuestChain[],
  setQuestChains: React.Dispatch<React.SetStateAction<QuestChain[]>>,
) {
  const { active, over } = event;
  const activeId: number = +`${active.id}`;

  const activeQuestChain: Option<QuestChain> =
    questChains.find(d => d.sequence == activeId) ?? null;
  if (!activeQuestChain) return;

  if (!over) return;
  const overId: number = +`${over.id}`;

  if (!active.data.current || !over.data.current) return;

  const activeIndex = +`${active.data.current.sortable.index}`;
  const overIndex = +`${over.data.current.sortable.index}`;
  const shiftDirection =
    Math.sign(activeIndex - overIndex) == 1 ? SortDirection.Up : SortDirection.Down;

  if (active.id !== over?.id) {
    setQuestChains(items => {
      items = arrayMove(
        items,
        items.indexOf(activeQuestChain),
        items.findIndex(v => v.sequence == overId),
      );

      items = items.map(questChain => {
        if (questChains.map(d => d.id).includes(questChain.id)) {
          const sortedQuestChain = Object.assign({}, questChain);

          if (sortedQuestChain.id == activeQuestChain.id) {
            sortedQuestChain.sequence = overId;
          } else {
            switch (shiftDirection) {
              case SortDirection.Down: {
                if (sortedQuestChain.sequence > activeId && sortedQuestChain.sequence <= overId) {
                  sortedQuestChain.sequence -= 1;
                }
              }
              case SortDirection.Up: {
                if (sortedQuestChain.sequence >= overId && sortedQuestChain.sequence < activeId) {
                  sortedQuestChain.sequence += 1;
                }
              }
            }
          }
          return sortedQuestChain;
        }
        return questChain;
      });

      const args: UpdateQuestChainSequenceInvokeArgs = {
        quest_chains: items,
      };
      invoke("update_quest_chain_sequence", args);

      return items;
    });
  }
}
