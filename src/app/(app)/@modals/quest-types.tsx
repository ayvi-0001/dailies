"use client";

import * as React from "react";

import * as heroui from "@heroui/react";

import { QuestType, useQuestTypes } from "@/components/daily/providers/quest-types";
import { cn } from "@/lib/utils";

import SearchParamModal from "./modal";

export default function Modal(): React.ReactElement {
  const questTypes: QuestType[] = useQuestTypes();

  return (
    <SearchParamModal
      modalContentAction={(moveProps, closeModal) =>
        function modalContent() {
          return (
            <>
              <heroui.ModalHeader {...moveProps} className="text-md justify-center text-white">
                Quest Types
              </heroui.ModalHeader>
              <heroui.ModalBody className="h-fit w-full overflow-hidden bg-black/90">
                <div className="flex flex-col gap-2">
                  {questTypes
                    .filter((v) => v.available)
                    .map((v, idx) => (
                      <div key={idx} className="rounded bg-gray-300 px-2 py-1 leading-none">
                        <span
                          className={cn(
                            "rounded px-1 text-sm leading-none font-bold underline underline-offset-1",
                            v.styles.typeBadgeClass,
                          )}
                        >
                          {v.name}
                        </span>
                        <br />
                        <span className="flex-wrap text-xs leading-none">{v.description}</span>
                        <br />
                      </div>
                    ))}
                </div>
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
      modalProps={{ className: "dark w-9/10" }}
      searchParamKey="modal"
    />
  );
}
