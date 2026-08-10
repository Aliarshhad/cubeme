import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { CubeLoader } from "./components/CubeLoader";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();

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
