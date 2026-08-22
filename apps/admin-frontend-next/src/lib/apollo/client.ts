import {
  ApolloClient,
  HttpLink,
  InMemoryCache,
  from,
  split,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { onError } from "@apollo/client/link/error";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { getMainDefinition } from "@apollo/client/utilities";
import { createClient } from "graphql-ws";

import { clearTokens, getAccessToken } from "@/lib/auth/storage";

const HTTP_ENDPOINT = "/api/graphql";
const WS_ENDPOINT = (() => {
  if (typeof window === "undefined") return "ws://localhost:3004/graphql";
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${window.location.host}/api/graphql-ws`;
})();

const httpLink = new HttpLink({ uri: HTTP_ENDPOINT });

const authLink = setContext((_, { headers }) => {
  const token = getAccessToken();
  return {
    headers: {
      ...headers,
      "apollo-require-preflight": "true",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
  };
});

const errorLink = onError(({ graphQLErrors, networkError }) => {
  const isUnauthenticated =
    graphQLErrors?.some(
      (e) =>
        e.extensions?.code === "UNAUTHENTICATED" ||
        /unauthorized|unauthenticated/i.test(e.message),
    ) || (networkError as { statusCode?: number } | undefined)?.statusCode === 401;

  if (isUnauthenticated && typeof window !== "undefined") {
    clearTokens();
    if (!window.location.pathname.startsWith("/login")) {
      const redirect = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `/login?redirect=${redirect}`;
    }
  }
});

const wsLink = new GraphQLWsLink(
  createClient({
    url: WS_ENDPOINT,
    lazy: true,
    retryAttempts: 5,
    connectionParams: () => {
      const token = getAccessToken();
      return token ? { authToken: token } : {};
    },
  }),
);

const splitLink = split(
  ({ query }) => {
    const def = getMainDefinition(query);
    return def.kind === "OperationDefinition" && def.operation === "subscription";
  },
  wsLink,
  from([errorLink, authLink, httpLink]),
);

export const apolloClient = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: { fetchPolicy: "cache-and-network" },
    query: { fetchPolicy: "network-only" },
  },
});
