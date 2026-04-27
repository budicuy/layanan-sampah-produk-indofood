"use client";

import { ProgressProvider } from "@bprogress/next/app";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ProgressProvider
      height="5px"
      color="#dc2626"
      options={{ showSpinner: false }}
      shallowRouting>
      {children}
    </ProgressProvider>
  );
}
