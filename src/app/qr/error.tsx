"use client";

import ToolError from "@/components/ToolError";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ToolError
      error={error}
      reset={reset}
      area="QR tools"
      backHref="/qr"
      backLabel="← All QR tools"
    />
  );
}