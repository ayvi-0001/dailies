import * as heroui from "@heroui/react";
import { Eye, EyeClosed } from "lucide-react";

import { Option } from "@/types/option";

export type FormState = {
  errors?: { [key: string]: Option<string[]> };
};

export function FormFieldErrors({
  state,
  formKey,
}: {
  state: FormState | undefined;
  formKey: string;
}): React.ReactNode {
  if (state?.errors && state.errors[formKey]) {
    return (
      <ul>
        {state?.errors[formKey].map((error: string) => (
          <li key={error} className="text-xs text-red-600">
            - {error}
          </li>
        ))}
      </ul>
    );
  } else return <></>;
}

export interface PasswordFieldProps extends heroui.InputProps {
  isVisible: boolean;
  setIsVisible: (value?: boolean) => void;
}

export function PasswordField(
  props: PasswordFieldProps,
): React.ReactElement<PasswordFieldProps, "heroui.Input"> {
  return (
    <>
      <style>
        {`
        input[type="password"]::-ms-reveal,
        input[type="password"]::-ms-clear {
          display: none;
        }
        `}
      </style>
      <heroui.Input
        fullWidth
        isRequired
        aria-autocomplete="none"
        className="text-[#f0f0ff]"
        classNames={{
          input: "text-xs",
          inputWrapper: "rounded-none data-[hover=true]:z-10 group-data-[focus-visible=true]:z-10",
        }}
        endContent={
          <button
            className="text-default-400 outline-transparent focus:outline-solid"
            type="button"
            onClick={() => props.setIsVisible(props.isVisible)}
          >
            {props.isVisible ? (
              <Eye className="pointer-events-none" />
            ) : (
              <EyeClosed className="pointer-events-none" />
            )}
          </button>
        }
        type={props.isVisible ? "text" : "password"}
        variant="bordered"
        {...props}
      />
    </>
  );
}
