import {
  getPendingQueries,
  markQuerySynced,
  clearSyncedQueries,
} from "./offlineQueue";

import { sendChatMessage } from "../api/chat";

let syncing = false;

export async function syncOfflineQueries(): Promise<void> {
  if (syncing) {
    return;
  }

  if (!navigator.onLine) {
    return;
  }

  syncing = true;

  try {
    const pendingQueries =
      await getPendingQueries();

    if (pendingQueries.length === 0) {
      return;
    }

    for (const item of pendingQueries) {
      if (item.id === undefined) {
        continue;
      }

      try {
        await sendChatMessage(
          item.userId,
          item.query,
          item.language
        );

        await markQuerySynced(
          item.id
        );
      } catch (error) {
        console.error(
          "Failed to synchronize offline query:",
          error
        );

        /*
         * Stop here so the query remains pending.
         * It can be retried the next time the
         * connection becomes available.
         */
        break;
      }
    }

    await clearSyncedQueries();
  } finally {
    syncing = false;
  }
}

/**
 * Start automatic synchronization.
 */
export function startOfflineSync() {
  /*
   * Try immediately when the application starts.
   */
  void syncOfflineQueries();

  /*
   * Try whenever the browser detects that
   * the internet connection has returned.
   */
  window.addEventListener(
    "online",
    () => {
      void syncOfflineQueries();
    }
  );

  /*
   * Also retry periodically while online.
   */
  const interval = window.setInterval(
    () => {
      if (navigator.onLine) {
        void syncOfflineQueries();
      }
    },
    30000
  );

  /*
   * Return cleanup function.
   */
  return () => {
    window.removeEventListener(
      "online",
      () => {
        void syncOfflineQueries();
      }
    );

    window.clearInterval(interval);
  };
}