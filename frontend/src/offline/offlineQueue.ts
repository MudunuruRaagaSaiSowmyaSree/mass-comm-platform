import {
  saveOfflineQuery,
  getPendingQueries as getPendingOfflineQueries,
  markQuerySynced as markOfflineQuerySynced,
  getOfflineDB,
} from "./db";

/**
 * Save a query while offline.
 */
export async function queueOfflineQuery(
  userId: string,
  query: string,
  language: string
) {
  return saveOfflineQuery({
    userId,
    query,
    language,
  });
}

/**
 * Get all queries waiting to be synchronized.
 */
export async function getPendingQueries() {
  return getPendingOfflineQueries();
}

/**
 * Mark a queued query as synchronized.
 */
export async function markQuerySynced(id: string) {
  return markOfflineQuerySynced(id);
}

/**
 * Alternative name for marking a query as synchronized.
 */
export async function markQueryAsSynced(id: string) {
  return markOfflineQuerySynced(id);
}

/**
 * Remove queries that have already synchronized.
 */
export async function clearSyncedQueries() {
  const db = await getOfflineDB();

  const transaction = db.transaction(
    "queries",
    "readwrite"
  );

  const store = transaction.objectStore("queries");

  const allItems = await store.getAll();

  for (const item of allItems) {
    if (item.status === "synced") {
      await store.delete(item.id);
    }
  }

  await transaction.done;
}

/**
 * Synchronize all pending queries.
 *
 * The API request function is supplied by the caller.
 */
export async function syncOfflineQueries(
  sendQuery: (
    userId: string,
    query: string,
    language: string
  ) => Promise<unknown>
) {
  const pendingQueries = await getPendingOfflineQueries();

  let syncedCount = 0;

  for (const item of pendingQueries) {
    try {
      await sendQuery(
        item.userId,
        item.query,
        item.language
      );

      await markOfflineQuerySynced(item.id);

      syncedCount++;
    } catch (error) {
      console.error(
        "Failed to synchronize offline query:",
        error
      );
    }
  }

  return syncedCount;
}