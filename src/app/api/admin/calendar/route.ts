import { ID } from "node-appwrite";
import { NextResponse } from "next/server";
import { config } from "@/app/lib/config";
import { currentAdmin } from "@/app/lib/auth";
import { canManageCalendar } from "@/app/lib/departments";
import { tables } from "@/app/lib/appwrite";
import { calendarItemSchema } from "@/app/lib/schemas";
import { rejectCrossOrigin } from "@/app/lib/security";
import { saoPauloLocalToIso } from "@/app/lib/date-time";

export async function POST(request: Request) {
  const cross = rejectCrossOrigin(request); if (cross) return cross;
  const admin = await currentAdmin();
  if (!admin || !canManageCalendar(admin)) return NextResponse.json({ error: "Sem permissão para editar o calendário." }, { status: 403 });
  const parsed = calendarItemSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Revise os dados da data." }, { status: 400 });
  const body = parsed.data;
  const row = await tables().createRow({ databaseId: config.databaseId, tableId: "calendar_items", rowId: ID.unique(), data: { ...body, summary: body.summary || null, endsAt: body.endsAt ? saoPauloLocalToIso(body.endsAt) : null, startsAt: saoPauloLocalToIso(body.startsAt), department: body.department || null, sourceUrl: body.sourceUrl || null, createdBy: admin.userId } });
  return NextResponse.json({ item: row }, { status: 201 });
}
