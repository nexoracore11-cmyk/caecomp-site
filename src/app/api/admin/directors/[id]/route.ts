import { NextResponse } from "next/server";
import { currentAdmin, can } from "@/app/lib/auth";
import { config } from "@/app/lib/config";
import { tables } from "@/app/lib/appwrite";
import { directorUpdateSchema } from "@/app/lib/schemas";
import { rejectCrossOrigin } from "@/app/lib/security";

async function allowed() { const admin = await currentAdmin(); return admin && (can(admin, "presidency") || can(admin, "secretary")); }

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const crossOrigin = rejectCrossOrigin(request); if (crossOrigin) return crossOrigin;
  if (!(await allowed())) return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  const parsed = directorUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Revise os dados do membro." }, { status: 400 });
  const data = Object.fromEntries(Object.entries(parsed.data).map(([key, value]) => [key, value === "" ? null : value]));
  const { id } = await params;
  const row = await tables().updateRow({ databaseId: config.databaseId, tableId: "directors", rowId: id, data });
  return NextResponse.json({ director: row });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const crossOrigin = rejectCrossOrigin(request); if (crossOrigin) return crossOrigin;
  if (!(await allowed())) return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  const { id } = await params;
  await tables().deleteRow({ databaseId: config.databaseId, tableId: "directors", rowId: id });
  return NextResponse.json({ ok: true });
}
