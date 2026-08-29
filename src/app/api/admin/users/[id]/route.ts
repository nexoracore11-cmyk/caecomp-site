import { NextResponse } from "next/server";
import { config } from "@/app/lib/config";
import { canCreateAccessLevel, canDelegatePermissions, canManageAdmin, currentAdmin, type Admin } from "@/app/lib/auth";
import { tables, users } from "@/app/lib/appwrite";
import { userUpdateSchema } from "@/app/lib/schemas";
import { rejectCrossOrigin } from "@/app/lib/security";

async function targetAdmin(id: string) {
  const row = await tables().getRow({ databaseId: config.databaseId, tableId: "administrators", rowId: id });
  const target = row as unknown as Admin;
  return { ...target, accessLevel: target.isOwner ? "supreme" as const : (target.accessLevel ?? "member") };
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const crossOrigin = rejectCrossOrigin(request); if (crossOrigin) return crossOrigin;
  const actor = await currentAdmin();
  if (!actor) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  const { id } = await params;
  const target = await targetAdmin(id);
  if (!canManageAdmin(actor, target))
    return NextResponse.json({ error: "A hierarquia desta conta impede alterar esse usuário." }, { status: 403 });
  const parsed = userUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  const { password, email, name, accessLevel, ...rowData } = parsed.data;
  if (password && actor.accessLevel !== "supreme")
    return NextResponse.json({ error: "Somente o Master Supremo redefine senhas de outras contas." }, { status: 403 });
  if (accessLevel && accessLevel !== target.accessLevel && !canCreateAccessLevel(actor, accessLevel))
    return NextResponse.json({ error: "Sua conta não pode atribuir esse nível." }, { status: 403 });
  if (rowData.permissions && !canDelegatePermissions(actor, rowData.permissions))
    return NextResponse.json({ error: "Sua conta não pode conceder uma ou mais dessas permissões." }, { status: 403 });
  if (email) await users().updateEmail({ userId: target.userId, email });
  if (name) await users().updateName({ userId: target.userId, name });
  if (password) await users().updatePassword({ userId: target.userId, password });
  const row = await tables().updateRow({ databaseId: config.databaseId, tableId: "administrators", rowId: id, data: { ...rowData, ...(accessLevel ? { accessLevel } : {}), ...(email ? { email } : {}), ...(name ? { name } : {}) } });
  return NextResponse.json({ user: row });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const crossOrigin = rejectCrossOrigin(request); if (crossOrigin) return crossOrigin;
  const actor = await currentAdmin();
  if (!actor) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  const { id } = await params;
  const target = await targetAdmin(id);
  if (!canManageAdmin(actor, target))
    return NextResponse.json({ error: "A hierarquia desta conta impede excluir esse usuário." }, { status: 403 });
  await tables().deleteRow({ databaseId: config.databaseId, tableId: "administrators", rowId: id });
  await users().delete({ userId: target.userId });
  return NextResponse.json({ ok: true });
}
