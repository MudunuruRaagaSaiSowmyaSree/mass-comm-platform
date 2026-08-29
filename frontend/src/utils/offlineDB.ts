import { openDB, type DBSchema, type IDBPDatabase } from "idb";

export interface OfflineQuery {
  id: string;
  userId: string;
  query: string;
  language: string;
  createdAt: string;
  status: "pending" | "synced";
}

export interface CachedKnowledge {
  id: string;
  title: string;
  content: string;
  domain: string;
  language: string;
  updatedAt: string;
}

interface OfflineDBSchema extends DBSchema {
  queries: {
    key: string;
    value: OfflineQuery;
    indexes: {
      "by-status": string;
      "by-created-at": string;
    };
  };

  knowledge: {
    key: string;
    value: CachedKnowledge;
    indexes: {
      "by-domain": string;
      "by-language": string;
    };
  };
}

let dbPromise: Promise<IDBPDatabase<OfflineDBSchema>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<OfflineDBSchema>("mass-comm-offline", 1, {
      upgrade(db) {
        const queryStore = db.createObjectStore("queries", {
          keyPath: "id",
        });

        queryStore.createIndex("by-status", "status");
        queryStore.createIndex("by-created-at", "createdAt");

        const knowledgeStore = db.createObjectStore("knowledge", {
          keyPath: "id",
        });

        knowledgeStore.createIndex("by-domain", "domain");
        knowledgeStore.createIndex("by-language", "language");
      },
    });
  }

  return dbPromise;
}

/**
 * Save an offline voice/text query.
 */
export async function saveOfflineQuery(
  query: OfflineQuery
): Promise<void> {
  const db = await getDB();

  await db.put("queries", query);
}

/**
 * Get all queries waiting for synchronization.
 */
export async function getPendingQueries(): Promise<OfflineQuery[]> {
  const db = await getDB();

  return db.getAllFromIndex(
    "queries",
    "by-status",
    "pending"
  );
}

/**
 * Mark a query as synchronized.
 */
export async function markQuerySynced(
  id: string
): Promise<void> {
  const db = await getDB();

  const query = await db.get("queries", id);

  if (!query) {
    return;
  }

  query.status = "synced";

  await db.put("queries", query);
}

/**
 * Delete a query after successful synchronization.
 */
export async function deleteOfflineQuery(
  id: string
): Promise<void> {
  const db = await getDB();

  await db.delete("queries", id);
}

/**
 * Save knowledge-base content locally.
 */
export async function cacheKnowledge(
  knowledge: CachedKnowledge
): Promise<void> {
  const db = await getDB();

  await db.put("knowledge", knowledge);
}

/**
 * Get cached knowledge by domain.
 */
export async function getKnowledgeByDomain(
  domain: string
): Promise<CachedKnowledge[]> {
  const db = await getDB();

  return db.getAllFromIndex(
    "knowledge",
    "by-domain",
    domain
  );
}

/**
 * Get cached knowledge by language.
 */
export async function getKnowledgeByLanguage(
  language: string
): Promise<CachedKnowledge[]> {
  const db = await getDB();

  return db.getAllFromIndex(
    "knowledge",
    "by-language",
    language
  );
}

/**
 * Clear all locally cached knowledge.
 */
export async function clearCachedKnowledge(): Promise<void> {
  const db = await getDB();

  await db.clear("knowledge");
}