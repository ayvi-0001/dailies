"use client";

import * as React from "react";

import * as heroui from "@heroui/react";
import { HTMLMotionProps } from "framer-motion";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { ReadonlyURLSearchParams, usePathname, useRouter, useSearchParams } from "next/navigation";

import addQuest, { AddQuestErrors, AddQuestState } from "@/actions/add-quest";
import { UserState, useState as useUserState } from "@/app/providers/user";
import { DailiesState, useDailies } from "@/components/daily";
import AddQuestForm from "@/components/daily/forms/add";
import { QuestType, useQuestTypes } from "@/components/daily/providers/quest-types";
import { Option } from "@/types/option";

export default function Modal(): React.ReactElement {
  const userState: UserState = useUserState();
  const questTypes: QuestType[] = useQuestTypes();
  const dailiesState: DailiesState = useDailies();

  const router: AppRouterInstance = useRouter();
  const searchParams: ReadonlyURLSearchParams = useSearchParams();
  const pathname: string = usePathname();

  const getReturnPathname = React.useCallback((): string => {
    const currentParams = new URLSearchParams(searchParams.toString());
    currentParams.delete("modal");
    return `${pathname}?${currentParams.toString()}`;
  }, [pathname, searchParams]);

  const [_, action, pending] = React.useActionState(
    async (state: AddQuestState, payload: FormData): Promise<AddQuestErrors> => {
      payload.set("userId", `${userState.user?.id}`);

      const typeId = payload.get("typeId");
      payload.set(
        "typeId",
        questTypes.find((questType: QuestType) => questType.name == typeId)!.id.replace("_", "-"),
      );

      const result = (await addQuest(state, payload)) as AddQuestErrors;

      dailiesState.triggerRefreshDailies();
      router.replace(getReturnPathname(), { scroll: false });

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
    canOverflow: false,
    isDisabled: false,
  });

  const motionProps: Omit<HTMLMotionProps<"div">, "ref"> = {
    variants: {
      enter: { y: 0, opacity: 1, transition: { duration: 0.3, ease: "easeOut" } },
      exit: { y: -20, opacity: 0, transition: { duration: 0.2, ease: "easeIn" } },
    },
  };

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
      motionProps={motionProps}
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
                onPress={(_: heroui.PressEvent) => {
                  onClose();
                  router.replace(getReturnPathname(), { scroll: false });
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
                onPress={(_: heroui.PressEvent) => {
                  formRef?.current?.requestSubmit();
                }}
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
