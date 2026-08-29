import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { config } from "./config";
import { Query, sessionAccount, tables } from "./appwrite";
import type { Permission } from "./permissions";
import type { AccessLevel } from "./types";
import { canCreateLevel, canGrantPermissions, canManageTarget, isMasterLevel } from "./access-policy";

export const sessionCookie = "caecomp_admin_session";
export type Admin = { $id:string; userId:string; email:string; name:string; active:boolean; isOwner:boolean; accessLevel:AccessLevel; permissions:Permission[]; mustChangePassword:boolean };

function normalizeAccessLevel(row: Partial<Admin>): AccessLevel {
  if (row.isOwner) return "supreme";
  if (["member", "master", "presidency"].includes(String(row.accessLevel))) return row.accessLevel as AccessLevel;
  return row.permissions?.includes("site_manage") ? "master" : "member";
}

export async function currentAdmin():Promise<Admin|null>{
  const secret=(await cookies()).get(sessionCookie)?.value; if(!secret) return null;
  try { const user=await sessionAccount(secret).get(); const list=await tables().listRows({databaseId:config.databaseId,tableId:"administrators",queries:[Query.equal("userId",[user.$id]),Query.equal("active",[true]),Query.limit(1)],total:false}); const row=list.rows[0] as unknown as Admin|undefined; return row?{...row,permissions:Array.isArray(row.permissions)?row.permissions:[],accessLevel:normalizeAccessLevel(row),mustChangePassword:Boolean(row.mustChangePassword)}:null; } catch { return null; }
}
export async function requireAdmin(){const admin=await currentAdmin();if(!admin)redirect("/admin/login");return admin;}
export function isMaster(admin: Pick<Admin,"accessLevel"|"isOwner">){return isMasterLevel(admin);}
export function can(admin:Admin, permission:Permission){return isMaster(admin)||admin.permissions.includes("site_manage")||admin.permissions.includes(permission);}
export function canCreateAccessLevel(actor:Admin, level:AccessLevel){return canCreateLevel(actor,level);}
export function canManageAdmin(actor:Admin,target:Pick<Admin,"userId"|"isOwner"|"accessLevel">){return canManageTarget(actor,target);}
export function canDelegatePermissions(actor:Admin,permissions:readonly Permission[]){return canGrantPermissions(actor,permissions);}
export async function requirePermission(permission:Permission){const admin=await currentAdmin();if(!admin||!can(admin,permission))return null;return admin;}
