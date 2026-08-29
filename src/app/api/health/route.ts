import { NextResponse } from "next/server";
import { config, hasAppwrite } from "@/app/lib/config";
import { Query, tables } from "@/app/lib/appwrite";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!hasAppwrite) return NextResponse.json({ status: "degraded", database: false }, { status: 503, headers: { "cache-control": "no-store" } });
  try {
    await tables().listRows({ databaseId: config.databaseId, tableId: "site_settings", queries: [Query.limit(1)], total: false });
    return NextResponse.json({ status: "ok", database: true }, { headers: { "cache-control": "no-store" } });
  } catch {
    return NextResponse.json({ status: "unavailable", database: false }, { status: 503, headers: { "cache-control": "no-store" } });
  }
}
