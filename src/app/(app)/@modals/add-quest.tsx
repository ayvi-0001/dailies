"use client";

import * as React from "react";

import * as heroui from "@heroui/react";

import addQuest from "@/actions/add-quest";
import { UserState, useState as useUserState } from "@/app/providers/user";
import { DailiesState, useDailies } from "@/components/daily";
import AddQuestForm from "@/components/daily/forms/add";
import { QuestType, useQuestTypes } from "@/components/daily/providers/quest-types";
import { FormState } from "@/lib/forms";
import { Option } from "@/types/option";

import SearchParamModal from "./modal";

export default function Modal(): React.ReactElement {
  const userState: UserState = useUserState();
  const questTypes: QuestType[] = useQuestTypes();
  const dailiesState: DailiesState = useDailies();
  const [_state, action, pending] = React.useActionState(
    async (state: FormState, payload: FormData): Promise<FormState> => {
      payload.set("userId", `${userState.user?.id}`);

      const typeId = payload.get("typeId");
      payload.set(
        "typeId",
        questTypes.find((questType: QuestType) => questType.name == typeId)!.id.replace("_", "-"),
      );

      const result = await addQuest(state, payload);

      dailiesState.triggerRefreshDailies();

      const chain = payload.get("chain")?.toString();
      if (chain && !dailiesState.questChains.map((v) => v.chain).includes(chain))
        dailiesState.triggerRefreshQuestChains();

      return result;
    },
    {},
  );

  const [isLoading, setIsLoading] = React.useState<boolean>(pending);
  React.useEffect(() => setIsLoading(pending), [pending]);

  const formRef: React.RefObject<Option<HTMLFormElement>> = React.useRef(null);

  return (
    <SearchParamModal
      modalContentAction={(moveProps, closeModal) =>
        function modalContent() {
          return (
            <>
              <heroui.ModalHeader {...moveProps} className="text-md justify-center">
                Add Quest
              </heroui.ModalHeader>
              <heroui.ModalBody className="bg-black/90 text-[#f0f0ff]">
                <AddQuestForm action={action} formRef={formRef} questTypes={questTypes} />
              </heroui.ModalBody>
              <heroui.ModalFooter className="flex flex-col justify-center">
                <heroui.Button
                  color="primary"
                  disabled={pending}
                  isLoading={isLoading}
                  size="sm"
                  type="submit"
                  onPress={() => {
                    formRef?.current?.requestSubmit();
                    closeModal();
                  }}
                >
                  Submit
                </heroui.Button>
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
