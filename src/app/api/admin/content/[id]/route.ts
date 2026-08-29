import { NextResponse } from "next/server";
import { config } from "@/app/lib/config";
import { currentAdmin, can, isMaster } from "@/app/lib/auth";
import { tables } from "@/app/lib/appwrite";
import type { Permission } from "@/app/lib/permissions";
import { rejectCrossOrigin } from "@/app/lib/security";
import { contentUpdateSchema } from "@/app/lib/schemas";

const modulePermission: Record<string, Permission> = { news: "news", events: "events", ca_products: "products", stores: "stores", documents: "documents", gallery: "gallery", company_opportunities: "opportunities", academic_opportunities: "academic" };
type ContentRow = { module: string; ownerUserId?: string; status: string };

function canApproveStores(admin: NonNullable<Awaited<ReturnType<typeof currentAdmin>>>) {
  return isMaster(admin) || admin.permissions.includes("stores_approve");
}
function ownsStore(admin: NonNullable<Awaited<ReturnType<typeof currentAdmin>>>, row: ContentRow) {
  return row.ownerUserId === admin.userId && admin.permissions.includes("stores");
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const crossOrigin = rejectCrossOrigin(request); if (crossOrigin) return crossOrigin;
  const admin = await currentAdmin();
  if (!admin) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  const { id } = await params;
  const current = await tables().getRow({ databaseId: config.databaseId, tableId: "content_items", rowId: id }) as unknown as ContentRow;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });

  if (current.module === "stores") {
    const approver = canApproveStores(admin);
    const ownProduct = ownsStore(admin, current);
    const requestedKeys = Object.keys(body);
    const statusOnly = requestedKeys.every((key) => key === "status");
    if (statusOnly) {
      if (!approver) return NextResponse.json({ error: "Somente masters ou aprovadores autorizados podem aprovar produtos." }, { status: 403 });
      if (!["pending", "published", "rejected"].includes(String(body.status)))
        return NextResponse.json({ error: "Status de aprovação inválido." }, { status: 400 });
      const row = await tables().updateRow({ databaseId: config.databaseId, tableId: "content_items", rowId: id, data: { status: body.status, reviewedBy: admin.userId, reviewedAt: new Date().toISOString() } });
      return NextResponse.json({ item: row });
    }
    if (!isMaster(admin) && !ownProduct)
      return NextResponse.json({ error: "Você só pode editar produtos da sua própria vendinha." }, { status: 403 });
    const parsed = contentUpdateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Revise os campos, números e links do produto." }, { status: 400 });
    const editable = ["title", "summary", "content", "imageUrl", "category", "price", "stockMode", "stockQty", "ownerName", "whatsapp", "sortOrder"];
    const data = Object.fromEntries(Object.entries(parsed.data).filter(([key]) => editable.includes(key)));
    if (!Object.keys(data).length) return NextResponse.json({ error: "Nenhum campo editável foi enviado." }, { status: 400 });
    const requiresReview = !isMaster(admin);
    const row = await tables().updateRow({ databaseId: config.databaseId, tableId: "content_items", rowId: id, data: { ...data, ...(requiresReview ? { status: "pending", reviewedBy: null, reviewedAt: null } : {}) } });
    return NextResponse.json({ item: row, message: requiresReview ? "Alterações enviadas para nova aprovação." : "Produto atualizado." });
  }

  if (!can(admin, modulePermission[current.module] ?? "site_manage"))
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  const parsed = contentUpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Revise os campos, números, datas e links do conteúdo." }, { status: 400 });
  const editable = ["title", "summary", "content", "imageUrl", "documentUrl", "category", "status", "startAt", "endAt", "location", "price", "stockMode", "stockQty", "capacityMode", "capacityQty", "ctaLabel", "ctaUrl", "ownerName", "whatsapp", "sortOrder"];
  const data = Object.fromEntries(Object.entries(parsed.data).filter(([key]) => editable.includes(key)).map(([key,value])=>[key,(key==="startAt"||key==="endAt")&&value?new Date(String(value)).toISOString():value===""?null:value]));
  const row = await tables().updateRow({ databaseId: config.databaseId, tableId: "content_items", rowId: id, data });
  return NextResponse.json({ item: row });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const crossOrigin = rejectCrossOrigin(request); if (crossOrigin) return crossOrigin;
  const admin = await currentAdmin();
  if (!admin) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  const { id } = await params;
  const current = await tables().getRow({ databaseId: config.databaseId, tableId: "content_items", rowId: id }) as unknown as ContentRow;
  if (current.module === "stores") {
    if (!isMaster(admin) && !ownsStore(admin, current))
      return NextResponse.json({ error: "Você só pode excluir produtos da sua própria vendinha." }, { status: 403 });
  } else if (!can(admin, modulePermission[current.module] ?? "site_manage")) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }
  await tables().deleteRow({ databaseId: config.databaseId, tableId: "content_items", rowId: id });
  return NextResponse.json({ ok: true });
}
