"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset: _,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => console.error(error), [error]);
  return <></>;
}
