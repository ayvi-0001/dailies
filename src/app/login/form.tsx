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
    <div className="rounded-large flex w-full max-w-sm flex-col gap-4 text-[#f0f0ff]">
      <div className="flex w-full flex-col items-center pb-6">
        <p className="text-xl font-medium">Welcome Back</p>
        <p className="text-default-500 text-sm">Log in to continue</p>
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
        validationBehavior="native"
      >
        <heroui.Input
          fullWidth
          isRequired
          aria-autocomplete="none"
          classNames={{
            inputWrapper:
              "rounded-none data-[hover=true]:z-10 group-data-[focus-visible=true]:z-10 border-medium border-slate-400 data-[hover=true]:border-white group-data-[focus=true]:border-slate-300",
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
              "rounded-none data-[hover=true]:z-10 group-data-[focus-visible=true]:z-10 border-medium border-slate-400 data-[hover=true]:border-white group-data-[focus=true]:border-slate-300",
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
          classNames={{
            wrapper: "bg-default-700 group-data-[hover=true]:before:bg-default-500",
          }}
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
      <p className="text-default-500 text-center text-sm">
        Need to create an account?&nbsp;
        <heroui.Link href="/signup" size="sm">
          Sign up
        </heroui.Link>
      </p>
    </div>
  );
}
