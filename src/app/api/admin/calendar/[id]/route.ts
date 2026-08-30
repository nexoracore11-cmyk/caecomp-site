import { NextResponse } from "next/server";
import { config } from "@/app/lib/config";
import { currentAdmin } from "@/app/lib/auth";
import { canManageCalendar } from "@/app/lib/departments";
import { tables } from "@/app/lib/appwrite";
import { calendarItemUpdateSchema } from "@/app/lib/schemas";
import { rejectCrossOrigin } from "@/app/lib/security";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const cross = rejectCrossOrigin(request); if (cross) return cross;
  const admin = await currentAdmin();
  if (!admin || !canManageCalendar(admin)) return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  const parsed = calendarItemUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Revise os dados da data." }, { status: 400 });
  const data = Object.fromEntries(Object.entries(parsed.data).map(([key, value]) => [key, key === "startsAt" || key === "endsAt" ? (value ? new Date(String(value)).toISOString() : null) : value === "" ? null : value]));
  const row = await tables().updateRow({ databaseId: config.databaseId, tableId: "calendar_items", rowId: (await params).id, data });
  return NextResponse.json({ item: row });
}
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const cross = rejectCrossOrigin(request); if (cross) return cross;
  const admin = await currentAdmin();
  if (!admin || !canManageCalendar(admin)) return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  await tables().deleteRow({ databaseId: config.databaseId, tableId: "calendar_items", rowId: (await params).id });
  return NextResponse.json({ ok: true });
}
