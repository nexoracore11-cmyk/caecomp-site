import { NextResponse } from "next/server";
import { config } from "@/app/lib/config";
import { currentAdmin, isMaster } from "@/app/lib/auth";
import { Query, storage, tables } from "@/app/lib/appwrite";
import { pretinhaModerationSchema } from "@/app/lib/schemas";
import { rejectCrossOrigin } from "@/app/lib/security";

type PhotoRow = { $id: string; fileId: string; status: string; selectedRank?: number; campaignId?:string };

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const crossOrigin = rejectCrossOrigin(request); if (crossOrigin) return crossOrigin;
  const admin = await currentAdmin();
  if (!admin || !isMaster(admin)) return NextResponse.json({ error: "Somente masters moderam a seleção da Pretinha." }, { status: 403 });
  const parsed = pretinhaModerationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Moderação inválida." }, { status: 400 });
  const { id } = await params;
  const current = await tables().getRow({ databaseId: config.databaseId, tableId: "pretinha_photos", rowId: id }) as unknown as PhotoRow;
  let selectedRank: number | null = null;
  if (parsed.data.status === "approved") {
    const campaign=current.campaignId?await tables().getRow({databaseId:config.databaseId,tableId:"photo_campaigns",rowId:current.campaignId}).catch(()=>null):null;
    const limit=Number(campaign?.selectionLimit??30);
    const approved = await tables().listRows({ databaseId: config.databaseId, tableId: "pretinha_photos", queries: [Query.equal("status", ["approved"]), ...(current.campaignId?[Query.equal("campaignId",[current.campaignId])]:[]), Query.limit(limit)], total: false });
    const used = new Set(approved.rows.filter((row) => row.$id !== id).map((row) => Number(row.selectedRank)));
    selectedRank = parsed.data.selectedRank ?? current.selectedRank ?? Array.from({ length: limit }, (_, index) => index + 1).find((rank) => !used.has(rank)) ?? null;
    if (!selectedRank || selectedRank>limit || used.has(selectedRank)) return NextResponse.json({ error: `As ${limit} posições já estão ocupadas ou essa posição já está em uso.` }, { status: 409 });
  }
  try {
    const row = await tables().updateRow({ databaseId: config.databaseId, tableId: "pretinha_photos", rowId: id, data: { status: parsed.data.status, selectedRank, reviewedAt: new Date().toISOString(), reviewedBy: admin.userId } });
    return NextResponse.json({ photo: row });
  } catch {
    return NextResponse.json({ error: "Não foi possível atualizar a seleção." }, { status: 409 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const crossOrigin = rejectCrossOrigin(request); if (crossOrigin) return crossOrigin;
  const admin = await currentAdmin();
  if (!admin || !isMaster(admin)) return NextResponse.json({ error: "Somente masters podem excluir envios." }, { status: 403 });
  const { id } = await params;
  const row = await tables().getRow({ databaseId: config.databaseId, tableId: "pretinha_photos", rowId: id }) as unknown as PhotoRow;
  await tables().deleteRow({ databaseId: config.databaseId, tableId: "pretinha_photos", rowId: id });
  await storage().deleteFile({ bucketId: config.bucketId, fileId: row.fileId }).catch(() => undefined);
  return NextResponse.json({ ok: true });
}
