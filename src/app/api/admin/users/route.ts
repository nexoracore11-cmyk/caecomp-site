import { ID } from "node-appwrite";
import { NextResponse } from "next/server";
import { config } from "@/app/lib/config";
import { tables, users } from "@/app/lib/appwrite";
import { canCreateAccessLevel, canDelegatePermissions, currentAdmin, isMaster } from "@/app/lib/auth";
import { userCreateSchema } from "@/app/lib/schemas";
import { rejectCrossOrigin } from "@/app/lib/security";

export async function GET() {
  const admin = await currentAdmin();
  if (!admin || (!isMaster(admin) && !admin.permissions.includes("users_manage")))
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  const result = await tables().listRows({ databaseId: config.databaseId, tableId: "administrators", total: false });
  return NextResponse.json({ users: result.rows });
}

export async function POST(request: Request) {
  const crossOrigin = rejectCrossOrigin(request); if (crossOrigin) return crossOrigin;
  const admin = await currentAdmin();
  if (!admin || (!isMaster(admin) && !admin.permissions.includes("users_manage")))
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  const parsed = userCreateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "Revise os dados, o nível e as permissões." }, { status: 400 });
  if (!canCreateAccessLevel(admin, parsed.data.accessLevel))
    return NextResponse.json({ error: "Sua conta não pode criar um usuário nesse nível." }, { status: 403 });
  if (!canDelegatePermissions(admin, parsed.data.permissions))
    return NextResponse.json({ error: "Sua conta não pode conceder uma ou mais dessas permissões." }, { status: 403 });
  try {
    const user = await users().create({ userId: ID.unique(), email: parsed.data.email, password: parsed.data.password, name: parsed.data.name });
    try {
      const row = await tables().createRow({
        databaseId: config.databaseId,
        tableId: "administrators",
        rowId: ID.unique(),
        data: { userId: user.$id, email: user.email, name: user.name, active: parsed.data.active, isOwner: false, accessLevel: parsed.data.accessLevel, permissions: parsed.data.permissions, createdBy: admin.userId, mustChangePassword:true },
      });
      return NextResponse.json({ user: row }, { status: 201 });
    } catch (error) {
      await users().delete({ userId: user.$id }).catch(() => undefined);
      throw error;
    }
  } catch {
    return NextResponse.json({ error: "Não foi possível criar. O e-mail pode já estar em uso." }, { status: 409 });
  }
}
