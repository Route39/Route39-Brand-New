import { useQuery } from "@apollo/client";
import { APIProvider } from "@vis.gl/react-google-maps";
import { createContext, useContext, type ReactNode } from "react";

import { CURRENT_CONFIGURATION_QUERY } from "@/lib/graphql/documents/management-detail-2";

const MapsKeyContext = createContext<string>("");

/**
 * Wraps the app with Google Maps API + Drawing library.
 *
 * The API key is read from the platform configuration (`currentConfiguration.adminPanelAPIKey`)
 * — the same value editable from /management/settings. Children render with no
 * provider while the config is still loading or if the platform has no key
 * configured; individual map components render `MissingMapsKey` in that case.
 */
export function MapsProvider({ children }: { children: ReactNode }) {
  const { data } = useQuery(CURRENT_CONFIGURATION_QUERY, {
    fetchPolicy: "cache-first",
    // currentConfiguration requires an authenticated operator — failing with
    // 401 on the login screen is fine, the panel renders maps only post-login.
    errorPolicy: "ignore",
  });

  const key = data?.currentConfiguration?.adminPanelAPIKey ?? "";

  if (!key) {
    return <MapsKeyContext.Provider value="">{children}</MapsKeyContext.Provider>;
  }

  return (
    <MapsKeyContext.Provider value={key}>
      <APIProvider apiKey={key} libraries={["drawing", "geometry", "places"]}>
        {children}
      </APIProvider>
    </MapsKeyContext.Provider>
  );
}

export function useMapsKey(): string {
  return useContext(MapsKeyContext);
}

export function MissingMapsKey() {
  return (
    <div className="rounded-md border border-dashed border-border bg-muted/20 p-6 text-center text-sm text-muted-foreground">
      <p className="font-medium">Google Maps API key not configured</p>
      <p className="mt-1 text-xs">
        Set <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">adminPanelAPIKey</code>{" "}
        in <a href="/management/settings" className="underline-offset-2 hover:underline">Settings</a>
        {" "}so map-driven pages can load.
      </p>
    </div>
  );
}
