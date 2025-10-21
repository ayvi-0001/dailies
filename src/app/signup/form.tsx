"use client";

import * as React from "react";

import { Button, Checkbox, Divider, Input, Link } from "@heroui/react";
import { Eye, EyeClosed } from "lucide-react";

import signup from "@/actions/signup";

export default function SignupForm() {
  const [state, action, pending] = React.useActionState(signup, undefined);
  const [isVisible, setIsVisible] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState<boolean>(pending);
  const [isConfirmVisible, setIsConfirmVisible] = React.useState(false);

  React.useEffect(() => setIsLoading(pending), [pending]);

  return (
    <div className="dark fixed inset-0 flex h-screen items-center justify-center select-none">
      <div className="flex h-full w-full items-center justify-center bg-transparent">
        <div className="rounded-large flex w-full max-w-sm flex-col gap-4">
          <div className="flex flex-col items-center pb-6">
            <p className="text-xl font-medium">Welcome</p>
            <p className="text-small text-default-500">Create an account to get started</p>
          </div>
          <form className="flex flex-col gap-3" action={action}>
            <div className="flex flex-col">
              <Input
                isRequired
                classNames={{
                  base: "-mb-[2px]",
                  inputWrapper:
                    "rounded-b-none data-[hover=true]:z-10 group-data-[focus-visible=true]:z-10",
                }}
                label="Username"
                name="username"
                aria-autocomplete="none"
                placeholder="Enter your username"
                fullWidth
                type="text"
                variant="bordered"
                className="text-white"
              />
              {state?.errors?.username && (
                <p className="text-xs text-red-600">{state.errors.username}</p>
              )}
              <Input
                isRequired
                classNames={{
                  base: "-mb-[2px]",
                  inputWrapper:
                    "rounded-none data-[hover=true]:z-10 group-data-[focus-visible=true]:z-10",
                }}
                endContent={
                  <button type="button" onClick={() => setIsVisible(!isVisible)}>
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
                fullWidth
                type={isVisible ? "text" : "password"}
                variant="bordered"
                className="text-white"
              />
              {state?.errors?.password && (
                <div>
                  <p className="text-xs text-red-600">Password must:</p>
                  <ul>
                    {state?.errors?.password.map((error: string) => (
                      <li className="text-xs text-red-600" key={error}>
                        - {error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <Input
                isRequired
                classNames={{
                  inputWrapper: "rounded-t-none",
                }}
                endContent={
                  <button type="button" onClick={() => setIsConfirmVisible(!isConfirmVisible)}>
                    {isConfirmVisible ? (
                      <Eye className="text-default-400 pointer-events-none text-2xl" />
                    ) : (
                      <EyeClosed className="text-default-400 pointer-events-none text-2xl" />
                    )}
                  </button>
                }
                label="Confirm Password"
                name="confirmPassword"
                placeholder="Confirm your password"
                fullWidth
                type={isConfirmVisible ? "text" : "password"}
                variant="bordered"
                className="text-white"
              />
              {state?.errors?.confirmPassword && (
                <div>
                  <ul>
                    {state?.errors?.confirmPassword.map((error: string) => (
                      <li className="text-xs text-red-600" key={error}>
                        - {error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="flex w-full items-center justify-between px-1 py-2">
              <Checkbox name="remember" size="sm">
                Stay logged-in
              </Checkbox>
            </div>
            <Button isLoading={isLoading} disabled={pending} color="primary" type="submit">
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
      </div>
    </div>
  );
}
