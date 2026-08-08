"use client";

import * as React from "react";
import { QueryClientProvider } from "@tanstack/react-query";

import { Providers as UiProviders } from "@cj/ui";

import { makeQueryClient } from "@/lib/query-client";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(() => makeQueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      <UiProviders>{children}</UiProviders>
    </QueryClientProvider>
  );
}
