import * as React from "react";

import * as heroui from "@heroui/react";

import editQuest from "@/actions/edit-quest";
import { User } from "@/app/providers/user";
import { FormState } from "@/lib/forms";
import type { Option } from "@/types/option";

import type { Daily } from "../../daily";
import EditDailyForm from "../forms/edit";
import { QuestType, useQuestTypes } from "../providers/quest-types";

type EditModalProps = {
  daily: Daily;
  disclosure: {
    isOpen: boolean;
    onOpen: () => void;
    onClose: () => void;
    onOpenChange: () => void;
    isControlled: boolean;
  };
  historic?: boolean;
  setIsLoadingAction: React.Dispatch<React.SetStateAction<boolean>>;
  title: string;
  updateDailyAction: (daily: Daily, patch: Partial<Daily>) => void;
  user: User;
};

export default function EditModal(props: EditModalProps): React.ReactNode {
  const { daily, historic, disclosure, setIsLoadingAction, title, updateDailyAction, user } = props;

  const questTypes: QuestType[] = useQuestTypes();

  const formRef: React.RefObject<Option<HTMLFormElement>> = React.useRef(null);

  const draggableRef = React.useRef<Option<HTMLElement>>(null);
  const { moveProps } = heroui.useDraggable({
    targetRef: draggableRef as React.RefObject<HTMLElement>,
    canOverflow: false,
    isDisabled: false,
  });

  const [isOpen, setIsOpen] = React.useState<boolean>(false);

  const [_state, action, pending] = React.useActionState(
    async (state: FormState, payload: FormData): Promise<FormState> => {
      setIsLoadingAction(true);

      const diff: Partial<Daily> = (await editQuest(
        state,
        payload,
        daily,
        questTypes,
        user.id,
        historic,
      )) as Partial<Daily>;

      if (!Object.hasOwn(diff, "errors")) {
        updateDailyAction(daily, diff);
      }

      setIsOpen(true);

      return state;
    },
    {},
  );

  React.useEffect(() => {
    if (isOpen === true) {
      disclosure.onClose();
      setIsOpen(false);
    }
  }, [isOpen, disclosure]);

  return (
    <>
      <heroui.Modal
        ref={draggableRef}
        disableAnimation
        hideCloseButton
        isDismissable
        shouldBlockScroll
        backdrop="transparent"
        className="dark w-9/10 text-white select-none"
        defaultOpen={true}
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
        onOpenChange={disclosure.onOpenChange}
      >
        <heroui.ModalContent className="flex border-1 border-gray-600 bg-black/95">
          {(onClose) => (
            <>
              <heroui.ModalHeader
                {...moveProps}
                className="text-md flex flex-col gap-1 self-center"
              >
                {title}
              </heroui.ModalHeader>
              <heroui.ModalBody className="bg-black/90 text-white">
                <div className="scrollbar-hide flex h-full flex-col overflow-x-auto whitespace-nowrap">
                  <EditDailyForm
                    action={action}
                    daily={daily}
                    formRef={formRef}
                    historic={historic}
                  />
                </div>
              </heroui.ModalBody>
              <heroui.ModalFooter className="my-4 flex justify-center gap-2 leading-none font-medium select-none">
                <heroui.Button color="danger" size="sm" variant="flat" onPress={onClose}>
                  close
                </heroui.Button>
                <heroui.Button
                  color="primary"
                  disabled={pending}
                  isLoading={pending}
                  size="sm"
                  type="submit"
                  onPress={() => formRef?.current?.requestSubmit()}
                >
                  save
                </heroui.Button>
              </heroui.ModalFooter>
            </>
          )}
        </heroui.ModalContent>
      </heroui.Modal>
    </>
  );
}
