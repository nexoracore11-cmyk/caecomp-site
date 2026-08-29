import { ID } from "node-appwrite";
import { InputFile } from "node-appwrite/file";
import { NextResponse } from "next/server";
import { config } from "@/app/lib/config";
import { currentAdmin, isMaster } from "@/app/lib/auth";
import { storage } from "@/app/lib/appwrite";
import { rejectCrossOrigin, validFileSignature } from "@/app/lib/security";
export async function POST(request: Request) {
  const crossOrigin = rejectCrossOrigin(request); if (crossOrigin) return crossOrigin;
  const admin = await currentAdmin();
  const uploadPermissions = ["site_manage", "news", "events", "products", "stores", "documents", "gallery", "opportunities", "academic"];
  if (!admin || (!isMaster(admin) && !admin.permissions.some((permission) => uploadPermissions.includes(permission))))
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || file.size < 1 || file.size > 30_000_000)
    return NextResponse.json(
      { error: "Arquivo inválido ou acima de 30 MB." },
      { status: 400 },
    );
  const allowed = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ];
  if (!allowed.includes(file.type))
    return NextResponse.json(
      { error: "Formato não permitido." },
      { status: 400 },
    );
  const buffer = Buffer.from(await file.arrayBuffer());
  if (!validFileSignature(buffer, file.type))
    return NextResponse.json({ error: "O conteúdo do arquivo não corresponde ao formato informado." }, { status: 400 });
  const saved = await storage().createFile({
    bucketId: config.bucketId,
    fileId: ID.unique(),
    file: InputFile.fromBuffer(
      buffer,
      file.name,
    ),
  });
  return NextResponse.json({
    fileId: saved.$id,
    url: `/api/media/${saved.$id}`,
  });
}
