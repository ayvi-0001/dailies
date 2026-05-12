import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";
import { z } from "zod";
import { SomeType } from "zod/v4/core";

import { FormState } from "@/lib/forms";
import { Option } from "@/types/option";

export const ChangePasswordFormSchema = z
  .object({
    userId: z.preprocess<Option<number>, SomeType, number>(
      val => (`${val}` === "" ? null : val),
      z.coerce.number<number>(),
    ),
    currentPassword: z.string().trim(),
    newPassword: z
      .string()
      .min(8, { message: "Be at least 8 characters long" })
      .regex(/[a-zA-Z]/, { message: "Contain at least one letter." })
      .regex(/[0-9]/, { message: "Contain at least one number." })
      .regex(/[^a-zA-Z0-9]/, {
        message: "Contain at least one special character.",
      })
      .trim(),
    confirmNewPassword: z.string().trim(),
  })
  .superRefine(({ confirmNewPassword, newPassword }, ctx) => {
    if (confirmNewPassword !== newPassword) {
      ctx.addIssue({
        code: "custom",
        message: "The passwords did not match",
        path: ["confirmPassword"],
      });
    }
  });

export default async function changePassword(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const validatedFields = ChangePasswordFormSchema.safeParse({
    userId: formData.get("userId"),
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmNewPassword: formData.get("confirmNewPassword"),
  });

  if (!validatedFields.success) {
    const errTree = z.treeifyError(validatedFields.error);
    return {
      errors: {
        currentPassword: errTree.properties?.currentPassword?.errors ?? null,
        newPassword: errTree.properties?.newPassword?.errors ?? null,
        confirmNewPassword: errTree.properties?.confirmNewPassword?.errors ?? null,
      },
    };
  }

  const { userId, currentPassword, newPassword } = validatedFields.data;

  await invoke("update_password", {
    user_id: userId,
    current_password: currentPassword,
    new_password: newPassword,
  }).catch(console.error);

  toast.success(`Successfully changed password`);

  return {} satisfies FormState;
}
