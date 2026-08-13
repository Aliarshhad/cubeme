import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { CubeLoader } from "./components/CubeLoader";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  // `networkMode: "always"` matters offline: our data layer answers from the
  // on-device database, so queries and mutations must still run when the
  // browser reports no connection instead of being paused.
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { networkMode: "always", retry: 1, gcTime: 24 * 60 * 60 * 1000 },
      mutations: { networkMode: "always" },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    defaultPendingMs: 0,
    defaultPendingMinMs: 0,
    defaultPendingComponent: () => <CubeLoader />,
  });

  return router;
};
