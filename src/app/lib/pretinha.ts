import "server-only";
import { connection } from "next/server";
import { config, hasAppwrite } from "./config";
import { Query, tables } from "./appwrite";
import type { PretinhaPhoto } from "./types";

export async function getApprovedCampaignPhotos(campaignId?:string,limit=30): Promise<PretinhaPhoto[]> {
  await connection();
  if (!hasAppwrite) return [];
  try {
    const result = await tables().listRows({
      databaseId: config.databaseId,
      tableId: "pretinha_photos",
      queries: [Query.equal("status", ["approved"]), ...(campaignId?[Query.equal("campaignId",[campaignId])]:[]), Query.orderAsc("selectedRank"), Query.limit(limit)],
      total: false,
    });
    return result.rows.map((row) => ({ ...row, id: row.$id })) as unknown as PretinhaPhoto[];
  } catch {
    return [];
  }
}

export async function getApprovedPretinhaPhotos():Promise<PretinhaPhoto[]>{return getApprovedCampaignPhotos(undefined,30);}
