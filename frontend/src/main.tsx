import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";

import "./styles/index.css";

import App from "./App";
import { startOfflineSync } from "./offline/syncOfflineQueries";

const queryClient = new QueryClient();

/*
 * Start offline query synchronization.
 */
startOfflineSync();

createRoot(
  document.getElementById("root")!
).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
);