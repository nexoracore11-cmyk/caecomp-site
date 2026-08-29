import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { config } from "@/app/lib/config";
import { currentAdmin, sessionCookie } from "@/app/lib/auth";
import { sessionAccount, tables } from "@/app/lib/appwrite";
import { profileSchema } from "@/app/lib/schemas";
import { rejectCrossOrigin } from "@/app/lib/security";

export async function PATCH(request: Request) {
  const crossOrigin = rejectCrossOrigin(request); if (crossOrigin) return crossOrigin;
  const admin = await currentAdmin();
  const secret = (await cookies()).get(sessionCookie)?.value;
  if (!admin || !secret) return NextResponse.json({ error: "Sessão inválida." }, { status: 401 });
  const parsed = profileSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Confira os dados." }, { status: 400 });
  try {
    const account = sessionAccount(secret);
    const { name, email, newPassword, currentPassword } = parsed.data;
    if (!name && !email && !newPassword) return NextResponse.json({ error: "Nenhuma alteração informada." }, { status: 400 });
    if (name) await account.updateName({ name });
    if (email) {
      if (!currentPassword) return NextResponse.json({ error: "Informe a senha atual para alterar o e-mail." }, { status: 400 });
      await account.updateEmail({ email, password: currentPassword });
    }
    if (newPassword) {
      if (!currentPassword) return NextResponse.json({ error: "Informe a senha atual." }, { status: 400 });
      await account.updatePassword({ password: newPassword, oldPassword: currentPassword });
    }
    await tables().updateRow({ databaseId: config.databaseId, tableId: "administrators", rowId: admin.$id, data: { ...(name ? { name } : {}), ...(email ? { email } : {}) } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Não foi possível atualizar. Confira a senha atual." }, { status: 400 });
  }
}
