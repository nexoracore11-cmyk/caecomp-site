import { NextResponse } from "next/server";
import { config } from "@/app/lib/config";
import { currentAdmin, can, isMaster } from "@/app/lib/auth";
import { tables } from "@/app/lib/appwrite";
import type { Permission } from "@/app/lib/permissions";
import { requestUpdateSchema } from "@/app/lib/schemas";
import { rejectCrossOrigin } from "@/app/lib/security";

const kindPermission: Record<string, Permission> = { product: "products", event: "events", opportunity: "opportunities" };
type RequestRow = { itemId: string; kind: string };
type ItemRow = { ownerUserId?: string };

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const crossOrigin = rejectCrossOrigin(request); if (crossOrigin) return crossOrigin;
  const admin = await currentAdmin();
  if (!admin) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  const parsed = requestUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Status ou observação inválidos." }, { status: 400 });
  const { id } = await params;
  const current = await tables().getRow({ databaseId: config.databaseId, tableId: "requests", rowId: id }) as unknown as RequestRow;
  let authorized = isMaster(admin) || can(admin, "requests");
  if (!authorized && current.kind === "store") {
    const item = await tables().getRow({ databaseId: config.databaseId, tableId: "content_items", rowId: current.itemId }) as unknown as ItemRow;
    authorized = admin.permissions.includes("stores") && item.ownerUserId === admin.userId;
  } else if (!authorized) {
    authorized = can(admin, kindPermission[current.kind] ?? "requests");
  }
  if (!authorized) return NextResponse.json({ error: "Sem permissão para esta solicitação." }, { status: 403 });
  const row = await tables().updateRow({ databaseId: config.databaseId, tableId: "requests", rowId: id, data: { status: parsed.data.status, internalNotes: parsed.data.internalNotes || null, assignedTo: admin.userId } });
  return NextResponse.json({ request: row });
}
