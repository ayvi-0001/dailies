"use client";

import * as React from "react";

import * as heroui from "@heroui/react";
import * as ReactUse from "@reactuses/core";
import { RedirectType, redirect } from "next/navigation";

import signup from "@/actions/signup";
import { FormFieldErrors, FormState, PasswordField } from "@/lib/forms";
import { UseBoolean } from "@/types/props";

export default function SignupForm(): React.ReactElement {
  const loading: UseBoolean = ReactUse.useBoolean();
  const passwordVisibility: UseBoolean = ReactUse.useBoolean();
  const confirmPasswordVisibility: UseBoolean = ReactUse.useBoolean();
  const stayLoggedIn: UseBoolean = ReactUse.useBoolean();

  const [state, action, pending] = React.useActionState(
    async (state: FormState, formData: FormData) => {
      return (await signup(state, formData, stayLoggedIn.value))
        .andThen((_) => redirect("/", RedirectType.replace))
        .unwrapOr({});
    },
    {},
  );

  React.useEffect(() => loading.setValue(pending), [loading, pending]);

  return (
    <div className="rounded-large flex w-full max-w-sm flex-col gap-4 text-[#f0f0ff]">
      <div className="flex flex-col items-center pb-6">
        <p className="text-xl font-medium">Welcome</p>
        <p className="text-default-500 text-sm">Create an account to get started</p>
      </div>
      <heroui.Form
        action={action}
        className="flex flex-col gap-3"
        style={{
          WebkitUserSelect: "none",
          MozUserSelect: "none",
          msUserSelect: "none",
          userSelect: "none",
        }}
      >
        <heroui.Input
          fullWidth
          isRequired
          aria-autocomplete="none"
          classNames={{
            inputWrapper:
              "rounded-b-none data-[hover=true]:z-10 group-data-[focus-visible=true]:z-10",
          }}
          label="Username"
          name="username"
          placeholder="Enter your username"
          type="text"
          variant="bordered"
        />
        <FormFieldErrors formKey="username" state={state} />
        <PasswordField
          classNames={{
            input: "text-sm",
            inputWrapper:
              "rounded-none data-[hover=true]:z-10 group-data-[focus-visible=true]:z-10",
          }}
          isVisible={passwordVisibility.value}
          label="Password"
          name="password"
          placeholder="Enter password"
          setIsVisible={passwordVisibility.toggle}
        />
        <FormFieldErrors formKey="password" state={state} />
        <PasswordField
          classNames={{
            input: "text-sm",
            inputWrapper: "rounded-t-none",
          }}
          isVisible={confirmPasswordVisibility.value}
          label="Confirm Password"
          name="confirmPassword"
          placeholder="Confirm your password"
          setIsVisible={confirmPasswordVisibility.toggle}
        />
        <FormFieldErrors formKey="currentPassword" state={state} />
        <heroui.Checkbox
          className="place-self-center"
          isSelected={stayLoggedIn.value}
          name="remember"
          size="sm"
          onValueChange={stayLoggedIn.toggle}
        >
          Stay logged-in
        </heroui.Checkbox>
        <heroui.Button
          className="w-full"
          color="primary"
          disabled={pending}
          isLoading={loading.value}
          type="submit"
        >
          Sign Up
        </heroui.Button>
      </heroui.Form>
      <div className="flex items-center py-2">
        <heroui.Divider className="flex-1" />
      </div>
      <p className="text-center text-sm text-[#f0f0ff]/50">
        Already have an account?&nbsp;
        <heroui.Link href="/login" size="sm">
          Log In
        </heroui.Link>
      </p>
    </div>
  );
}
