import { ID } from "node-appwrite";
import { NextResponse } from "next/server";
import { currentAdmin, can } from "@/app/lib/auth";
import { config } from "@/app/lib/config";
import { tables } from "@/app/lib/appwrite";
import { directorCreateSchema } from "@/app/lib/schemas";
import { rejectCrossOrigin } from "@/app/lib/security";

export async function POST(request: Request) {
  const crossOrigin = rejectCrossOrigin(request); if (crossOrigin) return crossOrigin;
  const admin = await currentAdmin();
  if (!admin || (!can(admin, "presidency") && !can(admin, "secretary"))) return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  const parsed = directorCreateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Revise os dados do membro e os links informados." }, { status: 400 });
  const data = parsed.data;
  const row = await tables().createRow({ databaseId: config.databaseId, tableId: "directors", rowId: ID.unique(), data: { ...data, photoUrl: data.photoUrl || null, whatsapp: data.whatsapp || null, linkedin: data.linkedin || null, lattes: data.lattes || null, instagram: data.instagram || null, active: true } });
  return NextResponse.json({ director: row }, { status: 201 });
}
