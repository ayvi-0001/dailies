"use client";

import * as React from "react";

import * as heroui from "@heroui/react";
import { HTMLMotionProps } from "framer-motion";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { ReadonlyURLSearchParams, usePathname, useRouter, useSearchParams } from "next/navigation";

export type ModalProps = {
  modalContentAction: (
    moveProps: React.DOMAttributes<HTMLElement>,
    closeModal: () => void,
  ) => (onClose: () => void) => React.ReactElement;
  modalContentProps?: Partial<React.ComponentProps<typeof heroui.ModalContent>>;
  modalProps?: Partial<React.ComponentProps<typeof heroui.Modal>>;
  searchParamKey: string;
};

export default function SearchParamModal(props: ModalProps): React.ReactElement {
  const { modalContentAction, modalContentProps, modalProps, searchParamKey } = props;

  const router: AppRouterInstance = useRouter();
  const searchParams: ReadonlyURLSearchParams = useSearchParams();
  const pathname: string = usePathname();

  const getReturnPathname = React.useCallback((): string => {
    const currentParams = new URLSearchParams(searchParams.toString());
    currentParams.delete(searchParamKey);
    return `${pathname}?${currentParams.toString()}`;
  }, [pathname, searchParams, searchParamKey]);

  const closeModal = React.useCallback(
    (): void => router.replace(getReturnPathname(), { scroll: false }),
    [router, getReturnPathname],
  );

  const draggableRef = React.useRef<HTMLElement>(null);
  const { moveProps } = heroui.useDraggable({
    targetRef: draggableRef as React.RefObject<HTMLElement>,
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
      isDismissable
      shouldBlockScroll
      backdrop="transparent"
      defaultOpen={true}
      motionProps={motionProps}
      placement="center"
      radius="none"
      shadow="lg"
      size="sm"
      onClose={closeModal}
      {...modalProps}
    >
      <heroui.ModalContent {...modalContentProps}>
        {modalContentAction(moveProps, closeModal)}
      </heroui.ModalContent>
    </heroui.Modal>
  );
}
