import { ID } from "node-appwrite";
import { InputFile } from "node-appwrite/file";
import { NextResponse } from "next/server";
import { config } from "@/app/lib/config";
import { Query, storage, tables } from "@/app/lib/appwrite";
import { pretinhaSubmissionSchema } from "@/app/lib/schemas";
import { clientFingerprint, consumeRateLimit, rejectCrossOrigin, validFileSignature } from "@/app/lib/security";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: Request) {
  const crossOrigin = rejectCrossOrigin(request); if (crossOrigin) return crossOrigin;
  const burst = consumeRateLimit(`photo:${clientFingerprint(request)}`, 8, 10 * 60 * 1000);
  if (!burst.allowed)
    return NextResponse.json({ error: "Muitas tentativas em pouco tempo. Aguarde alguns minutos." }, { status: 429, headers: { "Retry-After": String(burst.retryAfter) } });
  const form = await request.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Envio inválido." }, { status: 400 });
  const photo = form.get("photo");
  const campaignId=String(form.get("campaignId")??"");
  const parsed = pretinhaSubmissionSchema.safeParse({ title: String(form.get("title") ?? ""), description: String(form.get("description") ?? ""), website: String(form.get("website") ?? "") });
  if (!parsed.success || parsed.data.website)
    return NextResponse.json({ error: "Revise os campos enviados." }, { status: 400 });
  if (!(photo instanceof File) || photo.size < 100 || photo.size > 10_000_000 || !allowedTypes.has(photo.type))
    return NextResponse.json({ error: "Use uma imagem JPG, PNG ou WebP de até 10 MB." }, { status: 400 });
  const buffer = Buffer.from(await photo.arrayBuffer());
  if (!validFileSignature(buffer, photo.type))
    return NextResponse.json({ error: "O conteúdo do arquivo não corresponde a uma imagem válida." }, { status: 400 });
  if(!campaignId)return NextResponse.json({error:"Iniciativa não informada."},{status:400});
  const campaign=await tables().getRow({databaseId:config.databaseId,tableId:"photo_campaigns",rowId:campaignId}).catch(()=>null);
  if(!campaign||campaign.status!=="open")return NextResponse.json({error:"Os envios desta iniciativa estão encerrados."},{status:409});

  const submissionKey = clientFingerprint(request);
  const recent = await tables().listRows({ databaseId: config.databaseId, tableId: "pretinha_photos", queries: [Query.equal("submissionKey", [submissionKey]), Query.orderDesc("submittedAt"), Query.limit(5)], total: false });
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  if (recent.rows.filter((row) => new Date(String(row.submittedAt)).getTime() > oneHourAgo).length >= 5)
    return NextResponse.json({ error: "Limite de 5 envios por hora atingido. Tente novamente mais tarde." }, { status: 429 });

  const saved = await storage().createFile({ bucketId: config.bucketId, fileId: ID.unique(), file: InputFile.fromBuffer(buffer, photo.name) });
  try {
    const row = await tables().createRow({
      databaseId: config.databaseId,
      tableId: "pretinha_photos",
      rowId: ID.unique(),
      data: { fileId: saved.$id, title: parsed.data.title || null, description: parsed.data.description || null, mimeType: photo.type, status: "pending", submittedAt: new Date().toISOString(), submissionKey, campaignId },
    });
    return NextResponse.json({ ok: true, submissionId: row.$id }, { status: 201 });
  } catch {
    await storage().deleteFile({ bucketId: config.bucketId, fileId: saved.$id }).catch(() => undefined);
    return NextResponse.json({ error: "Não foi possível registrar a foto. Tente novamente." }, { status: 500 });
  }
}
