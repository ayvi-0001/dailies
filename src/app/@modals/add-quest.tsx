"use client";

import * as React from "react";

import * as heroui from "@heroui/react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { RedirectType, redirect, useRouter } from "next/navigation";

import * as User from "@/app/providers/user";
import addQuest, { AddQuestErrors, AddQuestState } from "@/actions/add-quest";
import AddQuestForm from "@/components/daily/forms/add";
import { QuestType, useQuestTypes } from "@/components/daily/providers/quest-types";
import { Option } from "@/types/option";

export default function Modal(): React.ReactElement {
  const router: AppRouterInstance = useRouter();

  const userState: User.UserState = User.useState();
  const questTypes: QuestType[] = useQuestTypes();

  const [_, action, pending] = React.useActionState(
    async (state: AddQuestState, payload: FormData): Promise<AddQuestErrors> => {
      payload.set("userId", `${userState.user?.id}`);

      const typeId = payload.get("typeId");
      payload.set(
        "typeId",
        questTypes.find((questType: QuestType) => questType.name == typeId)!.id.replace("_", "-"),
      );

      const result = addQuest(state, payload) as AddQuestErrors;
      router.back();
      return result;
    },
    undefined,
  );

  const [isLoading, setIsLoading] = React.useState<boolean>(pending);
  React.useEffect(() => setIsLoading(pending), [pending]);

  const formRef: React.RefObject<Option<HTMLFormElement>> = React.useRef(null);

  const draggableRef = React.useRef<HTMLElement>(null as unknown as HTMLElement);
  const { moveProps } = heroui.useDraggable({
    targetRef: draggableRef,
    canOverflow: true,
    isDisabled: false,
  });

  return (
    <heroui.Modal
      ref={draggableRef}
      disableAnimation
      hideCloseButton
      isKeyboardDismissDisabled
      shouldBlockScroll
      backdrop="transparent"
      className="dark z-1000 w-9/10 text-white select-none"
      defaultOpen={true}
      isDismissable={false}
      motionProps={{
        variants: {
          enter: { y: 0, opacity: 1, transition: { duration: 0.3, ease: "easeOut" } },
          exit: { y: -20, opacity: 0, transition: { duration: 0.2, ease: "easeIn" } },
        },
      }}
      placement="center"
      radius="none"
      shadow="lg"
      size="sm"
    >
      <heroui.ModalContent className="flex border-1 border-gray-600 bg-black/95">
        {onClose => (
          <div>
            <heroui.ModalHeader
              {...moveProps}
              className="text-md flex flex-col gap-1 justify-self-center"
            >
              Add Quest
            </heroui.ModalHeader>
            <heroui.ModalBody className="h-[50vh] bg-black/90 text-white">
              <heroui.ScrollShadow hideScrollBar className="h-[calc(100vh-50vh)]" offset={100}>
                <AddQuestForm action={action} formRef={formRef} questTypes={questTypes} />
              </heroui.ScrollShadow>
            </heroui.ModalBody>
            <heroui.ModalFooter className="flex justify-self-center">
              <heroui.Button
                color="danger"
                size="sm"
                variant="light"
                onPress={() => {
                  onClose();
                  redirect("/", RedirectType.replace);
                }}
              >
                Close
              </heroui.Button>
              <heroui.Button
                color="primary"
                disabled={pending}
                isLoading={isLoading}
                size="sm"
                type="submit"
                onPress={() => formRef?.current?.requestSubmit()}
              >
                Submit
              </heroui.Button>
            </heroui.ModalFooter>
          </div>
        )}
      </heroui.ModalContent>
    </heroui.Modal>
  );
}
