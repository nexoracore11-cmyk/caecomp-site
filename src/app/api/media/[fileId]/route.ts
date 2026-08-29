import { NextResponse } from "next/server";
import { config } from "@/app/lib/config";
import { storage } from "@/app/lib/appwrite";

export async function GET(_: Request, { params }: { params: Promise<{ fileId: string }> }) {
  try {
    const { fileId } = await params;
    if (!/^[A-Za-z0-9._-]{1,36}$/.test(fileId)) return new NextResponse(null, { status: 404 });
    const [metadata, file] = await Promise.all([storage().getFile({ bucketId: config.bucketId, fileId }), storage().getFileView({ bucketId: config.bucketId, fileId })]);
    const inline = String(metadata.mimeType).startsWith("image/") || metadata.mimeType === "application/pdf";
    const safeName = String(metadata.name).replace(/["\r\n]/g, "_");
    return new NextResponse(file, { headers: { "content-type": metadata.mimeType || "application/octet-stream", "content-disposition": `${inline ? "inline" : "attachment"}; filename="${safeName}"`, "cache-control": "public, max-age=86400, stale-while-revalidate=604800", "x-content-type-options": "nosniff" } });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
