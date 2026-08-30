import { ID } from "node-appwrite";
import { NextResponse } from "next/server";
import { config } from "@/app/lib/config";
import { tables, users } from "@/app/lib/appwrite";
import { currentAdmin, isMaster } from "@/app/lib/auth";
import { userCreateSchema } from "@/app/lib/schemas";
import { rejectCrossOrigin } from "@/app/lib/security";
import { sectionEnabled } from "@/app/lib/module-visibility";
import { getCurrentSections } from "@/app/lib/site-settings";

/** Creates only a basic vendinha account; it cannot be used to create staff. */
export async function POST(request: Request) {
  const crossOrigin = rejectCrossOrigin(request); if (crossOrigin) return crossOrigin;
  const admin = await currentAdmin();
  if (!admin || (!isMaster(admin) && !admin.permissions.includes("stores_users")))
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  if (!sectionEnabled(await getCurrentSections(), "stores"))
    return NextResponse.json({ error: "Vendinhas estão desativadas nas configurações do site." }, { status: 409 });
  const parsed = userCreateSchema.pick({ name: true, email: true, password: true }).safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "Use uma senha de ao menos 8 caracteres, com maiúscula, minúscula e número." }, { status: 400 });
  try {
    const user = await users().create({ userId: ID.unique(), ...parsed.data });
    try {
      const row = await tables().createRow({
        databaseId: config.databaseId,
        tableId: "administrators",
        rowId: ID.unique(),
        data: { userId: user.$id, email: user.email, name: user.name, active: true, isOwner: false, accessLevel: "member", permissions: ["stores"], createdBy: admin.userId, mustChangePassword: true },
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
