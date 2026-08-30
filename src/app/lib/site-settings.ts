import "server-only";
import { config } from "./config";
import { Query, tables } from "./appwrite";
import type { PublicSections } from "./module-visibility";

export async function getCurrentSections(): Promise<PublicSections> {
  const settings = await tables().listRows({ databaseId: config.databaseId, tableId: "site_settings", queries: [Query.equal("key", ["public"]), Query.limit(1)], total: false });
  try { return JSON.parse(String(settings.rows[0]?.value ?? "{}")).sections ?? {}; } catch { return {}; }
}
