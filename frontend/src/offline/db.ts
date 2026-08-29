import { openDB, type DBSchema } from "idb";

interface OfflineQuery {
  id: string;
  query: string;
  language: string;
  userId: string;
  createdAt: string;
  status: "pending" | "synced";
}

interface OfflineDB extends DBSchema {
  queries: {
    key: string;
    value: OfflineQuery;
    indexes: {
      "by-status": string;
      "by-createdAt": string;
    };
  };
}

const DB_NAME = "mass-comm-offline";
const DB_VERSION = 1;

export async function getOfflineDB() {
  return openDB<OfflineDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      const store = db.createObjectStore("queries", {
        keyPath: "id",
      });

      store.createIndex("by-status", "status");
      store.createIndex("by-createdAt", "createdAt");
    },
  });
}

export async function saveOfflineQuery(
  query: Omit<OfflineQuery, "id" | "createdAt" | "status">
) {
  const db = await getOfflineDB();

  const item: OfflineQuery = {
    ...query,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    status: "pending",
  };

  await db.put("queries", item);

  return item;
}

export async function getPendingQueries() {
  const db = await getOfflineDB();

  return db.getAllFromIndex(
    "queries",
    "by-status",
    "pending"
  );
}

export async function markQuerySynced(id: string) {
  const db = await getOfflineDB();

  const item = await db.get("queries", id);

  if (!item) {
    return;
  }

  item.status = "synced";

  await db.put("queries", item);
}