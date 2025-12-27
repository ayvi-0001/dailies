"use client";

import { useEffect } from "react";

import { toast } from "sonner";

export default function Error({
  error,
  reset: _,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => console.error(error), [error]);

  useEffect(() => {
    toast.error(error.message);
  }, [error]);

  return <></>;
}
