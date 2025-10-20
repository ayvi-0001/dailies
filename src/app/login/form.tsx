"use client";

import * as React from "react";

import { Button, Checkbox, Divider, Form, Input, Link } from "@heroui/react";
import { Eye, EyeClosed } from "lucide-react";

import login from "@/actions/login";

export default function LoginForm() {
  const [state, action, pending] = React.useActionState(login, undefined);
  const [isVisible, setIsVisible] = React.useState<boolean>(false);
  const [isLoading, setIsLoading] = React.useState<boolean>(pending);

  React.useEffect(() => setIsLoading(pending), [pending]);

  return (
    <div className="dark fixed inset-0 flex h-screen items-center justify-center">
      <div className="flex h-full w-full items-center justify-center bg-transparent">
        <div className="rounded-large flex w-full max-w-sm flex-col gap-4">
          <div className="flex flex-col items-center pb-6">
            <p className="text-default-500 text-xl font-medium">Welcome Back</p>
            <p className="text-small text-default-500">Log in to continue</p>
          </div>
          <Form className="flex flex-col gap-3" validationBehavior="native" action={action}>
            <Input
              isRequired
              label="Username"
              name="username"
              placeholder="Enter your username"
              aria-autocomplete="none"
              type="text"
              variant="bordered"
              className="text-white"
            />
            {state?.errors?.username && (
              <p className="text-xs text-red-600">{state.errors.username}</p>
            )}
            <Input
              isRequired
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
            <div className="flex w-full items-center justify-between px-1 py-2">
              {/* // TODO(ayvi): add stay logged-in functionality */}
              <Checkbox name="remember" size="sm">
                Stay logged-in
              </Checkbox>
            </div>
            <Button
              isLoading={isLoading}
              disabled={pending}
              className="w-full"
              color="primary"
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
      </div>
    </div>
  );
}
