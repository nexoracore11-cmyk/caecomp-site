import { NextResponse } from "next/server";
import { config } from "@/app/lib/config";
import { currentAdmin, isMaster } from "@/app/lib/auth";
import { storage, tables } from "@/app/lib/appwrite";

type PhotoRow = { fileId: string; mimeType: string; status: string };

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const row = await tables().getRow({ databaseId: config.databaseId, tableId: "pretinha_photos", rowId: id }) as unknown as PhotoRow;
    if (row.status !== "approved") {
      const admin = await currentAdmin();
      if (!admin || !isMaster(admin)) return new NextResponse(null, { status: 404 });
    }
    const file = await storage().getFileView({ bucketId: config.bucketId, fileId: row.fileId });
    return new NextResponse(file, { headers: { "content-type": row.mimeType, "cache-control": row.status === "approved" ? "public, max-age=86400, stale-while-revalidate=604800" : "private, no-store", "x-content-type-options": "nosniff" } });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
