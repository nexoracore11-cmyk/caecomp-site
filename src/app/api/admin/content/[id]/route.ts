import { NextResponse } from "next/server";
import { config } from "@/app/lib/config";
import { currentAdmin, can, isMaster } from "@/app/lib/auth";
import { canManageDepartment } from "@/app/lib/departments";
import { tables } from "@/app/lib/appwrite";
import type { Permission } from "@/app/lib/permissions";
import { rejectCrossOrigin } from "@/app/lib/security";
import { contentUpdateSchema, eventMetadataSchema } from "@/app/lib/schemas";
import { moduleEnabled } from "@/app/lib/module-visibility";
import { getCurrentSections } from "@/app/lib/site-settings";

const modulePermission: Record<string, Permission> = { news: "news", events: "events", ca_products: "products", stores: "stores", documents: "documents", gallery: "gallery", company_opportunities: "opportunities", academic_opportunities: "academic" };
type ContentRow = { module: string; ownerUserId?: string; status: string };
const paymentPattern = /\b(pix|chave\s+pix|pagamento\s+(por|via)|transfer[eê]ncia\s+banc[aá]ria)\b/i;

function ownsStore(admin: NonNullable<Awaited<ReturnType<typeof currentAdmin>>>, row: ContentRow) {
  return row.ownerUserId === admin.userId && admin.permissions.includes("stores");
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const crossOrigin = rejectCrossOrigin(request); if (crossOrigin) return crossOrigin;
  const admin = await currentAdmin();
  if (!admin) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  const { id } = await params;
  const current = await tables().getRow({ databaseId: config.databaseId, tableId: "content_items", rowId: id }) as unknown as ContentRow;
  if (!moduleEnabled(await getCurrentSections(), current.module))
    return NextResponse.json({ error: "Este módulo está desativado nas configurações do site." }, { status: 409 });
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });

  if (current.module === "stores") {
    const ownProduct = ownsStore(admin, current);
    if (!isMaster(admin) && !ownProduct)
      return NextResponse.json({ error: "Você só pode editar produtos da sua própria vendinha." }, { status: 403 });
    const parsed = contentUpdateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Revise os campos, números e links do produto." }, { status: 400 });
    if(paymentPattern.test([parsed.data.title,parsed.data.summary,parsed.data.content].filter(Boolean).join(" ")))return NextResponse.json({error:"Por segurança, use os contatos da loja para combinar pagamento; não publique Pix ou instruções de pagamento no site."},{status:400});
    const editable = ["title", "summary", "content", "imageUrl", "category", "price", "stockMode", "stockQty", "sortOrder", "metadata", "status"];
    const data = Object.fromEntries(Object.entries(parsed.data).filter(([key]) => editable.includes(key)));
    if (!Object.keys(data).length) return NextResponse.json({ error: "Nenhum campo editável foi enviado." }, { status: 400 });
    if (data.status && !["draft", "published", "archived"].includes(String(data.status))) return NextResponse.json({ error: "Status inválido." }, { status: 400 });
    const row = await tables().updateRow({ databaseId: config.databaseId, tableId: "content_items", rowId: id, data });
    return NextResponse.json({ item: row, message: "Produto atualizado." });
  }

  if (current.module === "department_posts" ? !canManageDepartment(admin, (current as ContentRow & { category?: string }).category) : !can(admin, modulePermission[current.module] ?? "site_manage"))
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  const parsed = contentUpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Revise os campos, números, datas e links do conteúdo." }, { status: 400 });
  if(current.module==="events"&&parsed.data.metadata){try{if(!eventMetadataSchema.safeParse(JSON.parse(parsed.data.metadata)).success)throw new Error()}catch{return NextResponse.json({error:"Configuração de evento inválida."},{status:400})}}
  const editable = ["title", "summary", "content", "imageUrl", "documentUrl", "category", "status", "startAt", "endAt", "location", "price", "stockMode", "stockQty", "capacityMode", "capacityQty", "ctaLabel", "ctaUrl", "ownerName", "whatsapp", "sortOrder", "metadata"];
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
  if (!moduleEnabled(await getCurrentSections(), current.module))
    return NextResponse.json({ error: "Este módulo está desativado nas configurações do site." }, { status: 409 });
  if (current.module === "stores") {
    if (!isMaster(admin) && !ownsStore(admin, current))
      return NextResponse.json({ error: "Você só pode excluir produtos da sua própria vendinha." }, { status: 403 });
  } else if (current.module === "department_posts" ? !canManageDepartment(admin, (current as ContentRow & { category?: string }).category) : !can(admin, modulePermission[current.module] ?? "site_manage")) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }
  await tables().deleteRow({ databaseId: config.databaseId, tableId: "content_items", rowId: id });
  return NextResponse.json({ ok: true });
}
