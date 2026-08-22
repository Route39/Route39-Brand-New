import { StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";

import "@/lib/i18n";
import { ApolloProvider } from "@/providers/ApolloProvider";
import { AuthProvider } from "@/providers/AuthProvider";
import { ConfirmProvider } from "@/providers/ConfirmProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { MapsProvider } from "@/components/maps/MapsProvider";
import { PwaUpdatePrompt } from "@/components/panel/PwaUpdatePrompt";
import { Toaster } from "@/components/ui/sonner";
import { Spinner } from "@/components/ui/spinner";
import { router } from "@/router";
import "@/styles/globals.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ApolloProvider>
      <AuthProvider>
        <ThemeProvider>
          <ConfirmProvider>
          <MapsProvider>
            <Suspense
              fallback={
                <div className="flex min-h-screen items-center justify-center">
                  <Spinner size="lg" />
                </div>
              }
            >
              <RouterProvider router={router} />
            </Suspense>
            <Toaster />
            <PwaUpdatePrompt />
          </MapsProvider>
          </ConfirmProvider>
        </ThemeProvider>
      </AuthProvider>
    </ApolloProvider>
  </StrictMode>,
);
