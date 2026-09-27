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
      area="image tools"
      backHref="/image"
      backLabel="← All image tools"
    />
  );
}