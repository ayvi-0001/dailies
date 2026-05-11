"use client";

import * as React from "react";

import * as heroui from "@heroui/react";
import { HTMLMotionProps } from "framer-motion";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { ReadonlyURLSearchParams, usePathname, useRouter, useSearchParams } from "next/navigation";

import { AppMetaState, useAppMetaState } from "@/app/providers/app-meta";

export default function Modal(): React.ReactElement {
  const router: AppRouterInstance = useRouter();
  const searchParams: ReadonlyURLSearchParams = useSearchParams();
  const pathname: string = usePathname();
  const appMeta: AppMetaState = useAppMetaState();

  const getReturnPathname = React.useCallback((): string => {
    const currentParams = new URLSearchParams(searchParams.toString());
    currentParams.delete("modal");
    return `${pathname}?${currentParams.toString()}`;
  }, [pathname, searchParams]);

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
      shouldBlockScroll
      backdrop="blur"
      className="dark z-1000 w-9/10 text-[#f0f0ff]"
      defaultOpen={true}
      motionProps={motionProps}
      placement="center"
      radius="none"
      shadow="lg"
      size="sm"
      onClose={closeModal}
    >
      <heroui.ModalContent className="flex border-1 border-gray-600 bg-black/95">
        <heroui.ModalHeader {...moveProps} className="text-md justify-center">
          About
        </heroui.ModalHeader>
        <heroui.ModalBody className="h-fit w-full overflow-hidden bg-black/90">
          <>
            <span className="text-xs">
              <p>App: {appMeta.buildInfo?.name}</p>
              <p>Identifier: {appMeta.buildInfo?.identifier}</p>
              <p>Version: {appMeta.buildInfo?.version}</p>
              {appMeta.buildInfo?.bundleType && <p>Bundle Type: {appMeta.buildInfo.bundleType}</p>}
              <heroui.Divider className="my-2" />
              <p>Env: {appMeta.env}</p>
              <p>Build Date: {appMeta.buildTimestamp}</p>
              <p>Target Triple: {appMeta.cargoTargetTriple}</p>
              <heroui.Divider className="my-2" />
              <p>Git Describe: {appMeta.gitDescribe}</p>
              <p>
                Git Sha: <span className="text-[10px]">{appMeta.gitSha}</span>
              </p>
              {appMeta.gitDirty && (
                <p>
                  Is Dirty
                  <br />
                  <span>Insertions: {/^-dev\+(\d+)-(\d+)$/.exec(appMeta.gitDirty)?.at(1)}</span>
                  <br />
                  <span>Deletions: {/^-dev\+(\d+)-(\d+)$/.exec(appMeta.gitDirty)?.at(2)}</span>
                </p>
              )}
              <heroui.Divider className="my-2" />
              <p>Nextjs Version: {appMeta.nextVersion}</p>
              <p>Tauri Version: {appMeta?.buildInfo?.tauriVersion}</p>
            </span>
          </>
        </heroui.ModalBody>
        <heroui.ModalFooter />
      </heroui.ModalContent>
    </heroui.Modal>
  );
}
