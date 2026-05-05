"use client";

import { ProgressProvider } from "@bprogress/next/app";
import { Toaster } from "react-hot-toast";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ProgressProvider
      height="5px"
      color="#dc2626"
      options={{ showSpinner: false }}
      shallowRouting>
      <Toaster position="top-right" />
      {children}
    </ProgressProvider>
  );
}
