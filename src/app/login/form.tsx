"use client";

import * as React from "react";

import { Button, Checkbox, Divider, Form, Input, Link } from "@heroui/react";
import { Eye, EyeClosed } from "lucide-react";

import login, { LoginErrors } from "@/actions/login";

export default function LoginForm(): React.ReactElement {
  const [state, action, pending] = React.useActionState(login, undefined);
  const [isVisible, setIsVisible] = React.useState<boolean>(false);
  const [isLoading, setIsLoading] = React.useState<boolean>(pending);

  React.useEffect(() => setIsLoading(pending), [pending]);

  return (
    <div className="rounded-large flex w-full max-w-sm flex-col gap-4">
      <div className="flex flex-col items-center pb-6">
        <p className="text-default-500 text-xl font-medium">Welcome Back</p>
        <p className="text-small text-default-500">Log in to continue</p>
      </div>
      <Form action={action} className="flex flex-col gap-3" validationBehavior="native">
        <UserNameField />
        <UserNameErrors state={state} />
        <PasswordField isVisible={isVisible} setIsVisibleAction={setIsVisible} />
        <PasswordErrors state={state} />
        <div className="flex w-full items-center justify-between px-1 py-2">
          {/* // TODO(ayvi): add stay logged-in functionality http://ayvi:3000/ayvi/dailies/issues/109 */}
          <Checkbox name="remember" size="sm">
            Stay logged-in
          </Checkbox>
        </div>
        <Button
          className="w-full"
          color="primary"
          disabled={pending}
          isLoading={isLoading}
          type="submit"
        >
          Sign In
        </Button>
      </Form>
      <div className="flex items-center gap-4 py-2">
        <Divider className="flex-1" />
      </div>
      <p className="text-small text-center text-white/50">
        Need to create an account?&nbsp;
        <Link href="/signup" size="sm">
          Sign up
        </Link>
      </p>
    </div>
  );
}

function UserNameField(): React.ReactElement {
  return (
    <Input
      isRequired
      aria-autocomplete="none"
      className="text-white"
      label="Username"
      name="username"
      placeholder="Enter your username"
      type="text"
      variant="bordered"
    />
  );
}

function UserNameErrors({ state }: { state: LoginErrors | undefined }): React.ReactNode {
  return (
    <>
      {state?.errors?.username && <p className="text-xs text-red-600">{state.errors.username}</p>}
    </>
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
      isRequired
      className="text-white"
      endContent={
        <button type="button" onClick={() => setIsVisibleAction(!isVisible)}>
          {isVisible ? (
            <Eye className="text-default-400 pointer-events-none text-2xl" />
          ) : (
            <EyeClosed className="text-default-400 pointer-events-none text-2xl" />
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

function PasswordErrors({ state }: { state: LoginErrors | undefined }): React.ReactNode {
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
