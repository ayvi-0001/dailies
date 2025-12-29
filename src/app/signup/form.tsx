"use client";

import * as React from "react";

import { Button, Checkbox, Divider, Input, Link } from "@heroui/react";
import { Eye, EyeClosed } from "lucide-react";

import signup, { SignupErrors } from "@/actions/signup";

export default function SignupForm(): React.ReactElement {
  const [state, action, pending] = React.useActionState(signup, undefined);
  const [isVisible, setIsVisible] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState<boolean>(pending);
  const [isConfirmVisible, setIsConfirmVisible] = React.useState(false);

  React.useEffect(() => setIsLoading(pending), [pending]);

  return (
    <div className="rounded-large flex w-full max-w-sm flex-col gap-4">
      <div className="flex flex-col items-center pb-6">
        <p className="text-xl font-medium">Welcome</p>
        <p className="text-small text-default-500">Create an account to get started</p>
      </div>
      <form action={action} className="flex flex-col gap-3">
        <div className="flex flex-col">
          <UserNameField />
          <UserNameErrors state={state} />
          <PasswordField isVisible={isVisible} setIsVisibleAction={setIsVisible} />
          <PasswordErrors state={state} />
          <ConfirmPasswordField
            isConfirmVisible={isConfirmVisible}
            setIsConfirmVisibleAction={setIsConfirmVisible}
          />
          <ConfirmPasswordErrors state={state} />
        </div>
        <div className="flex w-full items-center justify-between px-1 py-2">
          <Checkbox name="remember" size="sm">
            Stay logged-in
          </Checkbox>
        </div>
        <Button color="primary" disabled={pending} isLoading={isLoading} type="submit">
          Sign Up
        </Button>
      </form>
      <div className="flex items-center gap-4 py-2">
        <Divider className="flex-1" />
      </div>
      <p className="text-small text-center text-white/50">
        Already have an account?&nbsp;
        <Link href="/login" size="sm">
          Log In
        </Link>
      </p>
    </div>
  );
}

type PasswordFieldProps = {
  isVisible: boolean;
  setIsVisibleAction: React.Dispatch<React.SetStateAction<boolean>>;
};

function PasswordField(props: PasswordFieldProps): React.ReactElement {
  const { isVisible, setIsVisibleAction } = props;

  return (
    <Input
      fullWidth
      isRequired
      className="text-white"
      classNames={{
        base: "-mb-[2px]",
        inputWrapper: "rounded-none data-[hover=true]:z-10 group-data-[focus-visible=true]:z-10",
      }}
      endContent={
        <button type="button" onClick={() => setIsVisibleAction(!isVisible)}>
          {isVisible ? (
            <Eye className="text-default-400 pointer-events-none" />
          ) : (
            <EyeClosed className="text-default-400 pointer-events-none" />
          )}
        </button>
      }
      label="Password"
      name="password"
      placeholder="Enter your password"
      type={isVisible ? "text" : "password"}
      variant="bordered"
    />
  );
}

function PasswordErrors({ state }: { state: SignupErrors | undefined }): React.ReactNode {
  return (
    <>
      {state?.errors?.password && (
        <div>
          <p className="text-xs text-red-600">Password must:</p>
          <ul>
            {state?.errors?.password.map((error: string) => (
              <li key={error} className="text-xs text-red-600">
                - {error}
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

type ConfirmPasswordFieldProps = {
  isConfirmVisible: boolean;
  setIsConfirmVisibleAction: React.Dispatch<React.SetStateAction<boolean>>;
};

function ConfirmPasswordField(props: ConfirmPasswordFieldProps): React.ReactElement {
  const { isConfirmVisible, setIsConfirmVisibleAction } = props;

  return (
    <Input
      fullWidth
      isRequired
      className="text-white"
      classNames={{
        inputWrapper: "rounded-t-none",
      }}
      endContent={
        <button type="button" onClick={() => setIsConfirmVisibleAction(!isConfirmVisible)}>
          {isConfirmVisible ? (
            <Eye className="text-default-400 pointer-events-none" />
          ) : (
            <EyeClosed className="text-default-400 pointer-events-none" />
          )}
        </button>
      }
      label="Confirm Password"
      name="confirmPassword"
      placeholder="Confirm your password"
      type={isConfirmVisible ? "text" : "password"}
      variant="bordered"
    />
  );
}

function UserNameField(): React.ReactElement {
  return (
    <Input
      fullWidth
      isRequired
      aria-autocomplete="none"
      className="text-white"
      classNames={{
        base: "-mb-[2px]",
        inputWrapper: "rounded-b-none data-[hover=true]:z-10 group-data-[focus-visible=true]:z-10",
      }}
      label="Username"
      name="username"
      placeholder="Enter your username"
      type="text"
      variant="bordered"
    />
  );
}

function UserNameErrors({ state }: { state: SignupErrors | undefined }): React.ReactNode {
  return (
    <>
      {state?.errors?.username && <p className="text-xs text-red-600">{state.errors.username}</p>}
    </>
  );
}

function ConfirmPasswordErrors({ state }: { state: SignupErrors | undefined }): React.ReactNode {
  return (
    <>
      {state?.errors?.confirmPassword && (
        <div>
          <ul>
            {state?.errors?.confirmPassword.map((error: string) => (
              <li key={error} className="text-xs text-red-600">
                - {error}
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
