import { NextResponse } from "next/server";
import { config } from "@/app/lib/config";
import { currentAdmin, isMaster } from "@/app/lib/auth";
import { Query, tables } from "@/app/lib/appwrite";
import type { Permission } from "@/app/lib/permissions";

export async function GET() {
  const admin = await currentAdmin();
  if (!admin) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const mayViewUsers = isMaster(admin) || admin.permissions.includes("users_manage");
  const [content, requests, settings, directors, admins, pretinha, stores, campaigns] = await Promise.all([
    tables().listRows({ databaseId: config.databaseId, tableId: "content_items", queries: [Query.orderDesc("$createdAt"), Query.limit(100)], total: false }),
    tables().listRows({ databaseId: config.databaseId, tableId: "requests", queries: [Query.orderDesc("$createdAt"), Query.limit(100)], total: false }),
    tables().listRows({ databaseId: config.databaseId, tableId: "site_settings", queries: [Query.equal("key", ["public"]), Query.limit(1)], total: false }),
    tables().listRows({ databaseId: config.databaseId, tableId: "directors", queries: [Query.limit(100)], total: false }),
    mayViewUsers ? tables().listRows({ databaseId: config.databaseId, tableId: "administrators", queries: [Query.limit(100)], total: false }) : Promise.resolve({ rows: [] }),
    isMaster(admin) ? tables().listRows({ databaseId: config.databaseId, tableId: "pretinha_photos", queries: [Query.orderDesc("submittedAt"), Query.limit(200)], total: false }) : Promise.resolve({ rows: [] }),
    (isMaster(admin)||admin.permissions.includes("stores")||admin.permissions.includes("stores_approve")) ? tables().listRows({databaseId:config.databaseId,tableId:"store_profiles",queries:[Query.limit(100)],total:false}) : Promise.resolve({rows:[]}),
    isMaster(admin) ? tables().listRows({databaseId:config.databaseId,tableId:"photo_campaigns",queries:[Query.limit(100)],total:false}) : Promise.resolve({rows:[]}),
  ]);
  const modulePermission: Record<string, Permission> = { news: "news", events: "events", ca_products: "products", documents: "documents", gallery: "gallery", company_opportunities: "opportunities", academic_opportunities: "academic" };
  const visibleContent = content.rows.filter((row) => {
    if (isMaster(admin) || admin.permissions.includes("site_manage")) return true;
    if (row.module === "stores") {
      if (admin.permissions.includes("stores_approve")) return true;
      return admin.permissions.includes("stores") && row.ownerUserId === admin.userId;
    }
    const permission = modulePermission[String(row.module)];
    return Boolean(permission && admin.permissions.includes(permission));
  });
  const contentById = new Map(content.rows.map((row) => [row.$id, row]));
  const requestPermission: Record<string, Permission> = { product: "products", event: "events", opportunity: "opportunities" };
  const visibleRequests = requests.rows.filter((row) => {
    if (isMaster(admin) || admin.permissions.includes("site_manage") || admin.permissions.includes("requests")) return true;
    if (row.kind === "store") {
      const item = contentById.get(String(row.itemId));
      return admin.permissions.includes("stores") && item?.ownerUserId === admin.userId;
    }
    const permission = requestPermission[String(row.kind)];
    return Boolean(permission && admin.permissions.includes(permission));
  });
  const visibleStores=(isMaster(admin)||admin.permissions.includes("stores_approve"))?stores.rows:stores.rows.filter((row)=>row.ownerUserId===admin.userId);
  return NextResponse.json({ admin, content: visibleContent, requests: visibleRequests, directors: directors.rows, users: admins.rows, pretinha: pretinha.rows, stores:visibleStores, campaigns:campaigns.rows, settings: settings.rows[0] ? JSON.parse(String(settings.rows[0].value)) : null, settingsId: settings.rows[0]?.$id });
}
