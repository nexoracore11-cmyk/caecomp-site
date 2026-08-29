import { ID } from "node-appwrite";
import { NextResponse } from "next/server";
import { config } from "@/app/lib/config";
import { currentAdmin, can, isMaster } from "@/app/lib/auth";
import { tables } from "@/app/lib/appwrite";
import type { Permission } from "@/app/lib/permissions";
import { rejectCrossOrigin } from "@/app/lib/security";
import { contentCreateSchema, eventMetadataSchema } from "@/app/lib/schemas";

const modulePermission: Record<string, Permission> = { news: "news", events: "events", ca_products: "products", stores: "stores", documents: "documents", gallery: "gallery", company_opportunities: "opportunities", academic_opportunities: "academic" };
function allowed(admin: NonNullable<Awaited<ReturnType<typeof currentAdmin>>>, module: string) {
  return can(admin, modulePermission[module] ?? "site_manage");
}
function canApproveStores(admin: NonNullable<Awaited<ReturnType<typeof currentAdmin>>>) {
  return isMaster(admin) || admin.permissions.includes("stores_approve");
}

export async function POST(request: Request) {
  const crossOrigin = rejectCrossOrigin(request); if (crossOrigin) return crossOrigin;
  const admin = await currentAdmin();
  if (!admin) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  const parsed = contentCreateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Revise os campos, números, datas e links do conteúdo." }, { status: 400 });
  const body = parsed.data;
  if(body.module==="events"&&body.metadata){try{if(!eventMetadataSchema.safeParse(JSON.parse(body.metadata)).success)throw new Error()}catch{return NextResponse.json({error:"Configuração de evento inválida."},{status:400})}}
  if (!allowed(admin, body.module)) return NextResponse.json({ error: "Sem permissão para este módulo." }, { status: 403 });
  const isStore = body.module === "stores";
  let storeOwnerUserId:string|null=null;
  if(isStore){
    if(!body.storeId)return NextResponse.json({error:"Selecione a vendinha deste produto."},{status:400});
    const store=await tables().getRow({databaseId:config.databaseId,tableId:"store_profiles",rowId:body.storeId}).catch(()=>null);
    if(!store)return NextResponse.json({error:"Vendinha não encontrada."},{status:404});
    if(!isMaster(admin)&&store.ownerUserId!==admin.userId)return NextResponse.json({error:"Você só pode cadastrar produtos na sua vendinha."},{status:403});
    storeOwnerUserId=String(store.ownerUserId);
  }
  const storeApprover = canApproveStores(admin);
  const requestedStatus = String(body.status ?? "draft");
  const status = isStore && !storeApprover ? "pending" : (["draft", "pending", "published", "rejected", "archived"].includes(requestedStatus) ? requestedStatus : "draft");
  const data = {
    module: body.module, title: body.title,
    slug: String(body.slug || body.title).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 240) + "-" + Date.now().toString(36),
    summary: body.summary, content: body.content || null, imageUrl: body.imageUrl || null, documentUrl: body.documentUrl || null, category: body.category || null,
    status, startAt: body.startAt ? new Date(body.startAt).toISOString() : null, endAt: body.endAt ? new Date(body.endAt).toISOString() : null, location: body.location || null, price: body.price ?? null,
    stockMode: body.stockMode || null, stockQty: body.stockQty ?? null, capacityMode: body.capacityMode || null, capacityQty: body.capacityQty ?? null,
    ctaLabel: body.ctaLabel || null, ctaUrl: body.ctaUrl || null, ownerName: body.ownerName || null, whatsapp: body.whatsapp || null, sortOrder: body.sortOrder,
    ownerUserId: isStore ? admin.userId : null,
    reviewedBy: isStore && status === "published" ? admin.userId : null,
    reviewedAt: isStore && status === "published" ? new Date().toISOString() : null,
    storeId: body.storeId || null,
    metadata: body.metadata || null,
    ...(isStore?{ownerUserId:storeOwnerUserId,ownerName:null,whatsapp:null}:{}),
  };
  const row = await tables().createRow({ databaseId: config.databaseId, tableId: "content_items", rowId: ID.unique(), data });
  return NextResponse.json({ item: row, message: isStore && status === "pending" ? "Produto enviado para aprovação." : "Conteúdo cadastrado." }, { status: 201 });
}
