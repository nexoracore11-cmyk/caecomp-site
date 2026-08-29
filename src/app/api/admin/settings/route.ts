import { NextResponse } from "next/server";
import { config } from "@/app/lib/config";
import { currentAdmin, can } from "@/app/lib/auth";
import { Query, tables } from "@/app/lib/appwrite";
import { settingsPatchSchema } from "@/app/lib/schemas";
import { rejectCrossOrigin } from "@/app/lib/security";

export async function PATCH(request: Request) {
  const crossOrigin = rejectCrossOrigin(request); if (crossOrigin) return crossOrigin;
  const admin = await currentAdmin();
  if (!admin) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  const parsed = settingsPatchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Configuração inválida. Use links de publicações do Instagram e textos dentro dos limites." }, { status: 400 });
  if (!can(admin, "site_manage") && !(can(admin, "marketing") && Object.keys(parsed.data).every((key) => key === "instagramPosts")))
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  const current = await tables().listRows({ databaseId: config.databaseId, tableId: "site_settings", queries: [Query.equal("key", ["public"]), Query.limit(1)], total: false });
  if (!current.rows[0]) return NextResponse.json({ error: "Configuração pública não inicializada." }, { status: 503 });
  const previous = JSON.parse(String(current.rows[0].value));
  const next = { ...previous, ...parsed.data, ...(parsed.data.sections ? { sections: { ...previous.sections, ...parsed.data.sections } } : {}) };
  const row = await tables().updateRow({ databaseId: config.databaseId, tableId: "site_settings", rowId: current.rows[0].$id, data: { value: JSON.stringify(next) } });
  return NextResponse.json({ settings: JSON.parse(String(row.value)) });
}
