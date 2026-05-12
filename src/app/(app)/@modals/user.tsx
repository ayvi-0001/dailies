"use client";

import * as React from "react";

import * as heroui from "@heroui/react";
import * as ReactUse from "@reactuses/core";

import changePassword from "@/actions/change-password";
import { User, useState as useUserState } from "@/app/providers/user";
import { FormFieldErrors, FormState, PasswordField } from "@/lib/forms";
import { Option } from "@/types/option";
import { UseBoolean } from "@/types/props";

import SearchParamModal from "./modal";

export default function Modal(): React.ReactElement {
  const user: User = useUserState().user;

  const [userActionState, setUserActionState] = ReactUse.useSetState({ changePassword: false });

  return (
    <SearchParamModal
      modalContentAction={(moveProps, closeModal) =>
        function modalContent() {
          return (
            <>
              <heroui.ModalHeader {...moveProps} className="text-md justify-center">
                User Settings
              </heroui.ModalHeader>
              <heroui.ModalBody className="h-fit w-full overflow-hidden bg-black/90 text-sm">
                <div className="flex flex-col gap-1 text-right">
                  <div className="text-xl font-bold text-shadow-md">{user.name}</div>
                  <div>ID: {user.id}</div>
                  <div>Created: {user.created.toString()}</div>
                </div>
                <heroui.Divider className="my-2" />
                {userActionState.changePassword ? (
                  <div className="flex flex-col gap-3">
                    <ChangePasswordForm
                      userId={user.id}
                      onCloseAction={() => setUserActionState({ changePassword: false })}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <heroui.Button
                      color="primary"
                      size="sm"
                      variant="flat"
                      onPress={() => setUserActionState({ changePassword: true })}
                    >
                      Change Password
                    </heroui.Button>
                    <heroui.Button isDisabled color="danger" size="sm" variant="flat">
                      Delete User
                    </heroui.Button>
                  </div>
                )}
              </heroui.ModalBody>
              <heroui.ModalFooter className="flex flex-col justify-center">
                <heroui.Divider />
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

export function ChangePasswordForm(props: {
  userId: number;
  onCloseAction?: () => void;
}): React.ReactElement {
  const formRef: React.RefObject<Option<HTMLFormElement>> = React.useRef(null);

  const [state, action, pending] = React.useActionState(
    async (state: FormState, formData: FormData): Promise<FormState> => {
      formData.set("userId", `${props.userId}`);
      const result = await changePassword(state, formData);
      if (!result?.errors && props.onCloseAction) props.onCloseAction();
      return result;
    },
    {},
  );

  const currentPasswordVisibility: UseBoolean = ReactUse.useBoolean();
  const newPasswordVisibility: UseBoolean = ReactUse.useBoolean();
  const confirmNewPasswordVisibility: UseBoolean = ReactUse.useBoolean();

  const [isLoading, setIsLoading] = React.useState<boolean>(pending);
  React.useEffect(() => setIsLoading(pending), [pending]);

  return (
    <heroui.Form ref={formRef} action={action} className="flex flex-col gap-3">
      <PasswordField
        isVisible={currentPasswordVisibility.value}
        label="Your Password"
        name="currentPassword"
        placeholder="Current password"
        setIsVisible={currentPasswordVisibility.toggle}
      />
      <FormFieldErrors formKey="currentPassword" state={state} />
      <PasswordField
        isVisible={newPasswordVisibility.value}
        label="New Password"
        name="newPassword"
        placeholder="Enter your new password"
        setIsVisible={newPasswordVisibility.toggle}
      />
      <FormFieldErrors formKey="newPassword" state={state} />
      <PasswordField
        isVisible={confirmNewPasswordVisibility.value}
        label="Re-enter your new password"
        name="confirmNewPassword"
        placeholder="Confirm password"
        setIsVisible={confirmNewPasswordVisibility.toggle}
      />
      <FormFieldErrors formKey="confirmNewPassword" state={state} />
      <div className="flex w-full flex-col gap-2">
        <heroui.Button
          color="primary"
          disabled={pending}
          isLoading={isLoading}
          size="sm"
          type="submit"
        >
          Submit
        </heroui.Button>
        <heroui.Button color="danger" size="sm" variant="flat" onPress={props.onCloseAction}>
          Cancel
        </heroui.Button>
      </div>
    </heroui.Form>
  );
}
