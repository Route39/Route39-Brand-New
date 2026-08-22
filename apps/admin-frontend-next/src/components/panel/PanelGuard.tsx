import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";

import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/providers/AuthProvider";

export function PanelGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }

  return <>{children}</>;
}
