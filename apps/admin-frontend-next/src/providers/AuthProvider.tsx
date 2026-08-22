import { useApolloClient, useLazyQuery, useQuery } from "@apollo/client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { LOGIN2_QUERY, ME_QUERY } from "@/lib/graphql/documents/auth";
import {
  clearTokens,
  getAccessToken,
  setTokens,
} from "@/lib/auth/storage";
import type { MeQuery } from "@/lib/graphql/__generated__/graphql";

type AuthUser = MeQuery["me"];

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (input: { userName: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const apollo = useApolloClient();
  const [hasToken, setHasToken] = useState<boolean>(() => Boolean(getAccessToken()));

  const meQuery = useQuery(ME_QUERY, {
    skip: !hasToken,
    fetchPolicy: "cache-and-network",
    notifyOnNetworkStatusChange: true,
  });

  const [runLogin] = useLazyQuery(LOGIN2_QUERY, {
    fetchPolicy: "network-only",
  });

  const login = useCallback(
    async ({ userName, password }: { userName: string; password: string }) => {
      const { data, error } = await runLogin({ variables: { userName, password } });
      if (error) throw error;
      if (!data?.login2) throw new Error("Login failed");
      setTokens({
        accessToken: data.login2.accessToken,
        refreshToken: data.login2.refreshToken,
      });
      setHasToken(true);
      await apollo.resetStore();
    },
    [apollo, runLogin],
  );

  const logout = useCallback(async () => {
    clearTokens();
    setHasToken(false);
    await apollo.clearStore();
  }, [apollo]);

  useEffect(() => {
    if (!hasToken) return;
    if (meQuery.error) {
      clearTokens();
      setHasToken(false);
    }
  }, [hasToken, meQuery.error]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: hasToken ? meQuery.data?.me ?? null : null,
      loading: hasToken && meQuery.loading && !meQuery.data,
      login,
      logout,
    }),
    [hasToken, meQuery.data, meQuery.loading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
