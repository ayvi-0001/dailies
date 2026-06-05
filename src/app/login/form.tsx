"use client";

import * as React from "react";

import * as heroui from "@heroui/react";
import * as ReactUse from "@reactuses/core";
import { RedirectType, redirect } from "next/navigation";

import login from "@/actions/login";
import { FormFieldErrors, FormState, PasswordField } from "@/lib/forms";
import { UseBoolean } from "@/types/props";

export default function LoginForm(): React.ReactElement {
  const loading: UseBoolean = ReactUse.useBoolean();
  const passwordVisibility: UseBoolean = ReactUse.useBoolean();
  const stayLoggedIn: UseBoolean = ReactUse.useBoolean();

  const [state, action, pending] = React.useActionState(
    async (state: FormState, formData: FormData) => {
      return (await login(state, formData, stayLoggedIn.value))
        .andThen((_) => redirect("/", RedirectType.replace))
        .unwrapOr({});
    },
    {},
  );

  React.useEffect(() => loading.setValue(pending), [loading, pending]);

  return (
    <div className="rounded-large flex w-full max-w-sm flex-col gap-4">
      <div className="flex w-full flex-col items-center pb-6">
        <p className="text-default-500 text-xl font-medium">Welcome Back</p>
        <p className="text-small text-default-500">Log in to continue</p>
      </div>
      <heroui.Form
        action={action}
        className="flex flex-col gap-3 text-sm text-[#f0f0ff]"
        validationBehavior="native"
      >
        <heroui.Input
          isRequired
          aria-autocomplete="none"
          classNames={{
            inputWrapper:
              "rounded-none data-[hover=true]:z-10 group-data-[focus-visible=true]:z-10",
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
            inputWrapper: "rounded-none",
          }}
          isVisible={passwordVisibility.value}
          label="Password"
          name="password"
          placeholder="Enter your password"
          setIsVisible={passwordVisibility.toggle}
        />
        <FormFieldErrors formKey="password" state={state} />
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
          Sign In
        </heroui.Button>
      </heroui.Form>
      <div className="flex items-center py-2">
        <heroui.Divider className="flex-1" />
      </div>
      <p className="text-small text-center text-white/50">
        Need to create an account?&nbsp;
        <heroui.Link href="/signup" size="sm">
          Sign up
        </heroui.Link>
      </p>
    </div>
  );
}
