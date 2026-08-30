export type PolicyAccessLevel = "member" | "master" | "presidency" | "supreme";
export type PolicyActor = {
  userId: string;
  isOwner: boolean;
  accessLevel: PolicyAccessLevel;
  permissions: readonly string[];
};
export type PolicyTarget = Pick<PolicyActor, "userId" | "isOwner" | "accessLevel">;

export function isMasterLevel(actor: Pick<PolicyActor, "accessLevel" | "isOwner">) {
  return actor.isOwner || actor.accessLevel === "master" || actor.accessLevel === "presidency" || actor.accessLevel === "supreme";
}

export function canCreateLevel(actor: PolicyActor, level: PolicyAccessLevel) {
  if (level === "supreme") return false;
  if (actor.accessLevel === "supreme") return true;
  if (actor.accessLevel === "presidency") return level === "master" || level === "member";
  return level === "member" && (isMasterLevel(actor) || actor.permissions.includes("users_manage"));
}

export function canManageTarget(actor: PolicyActor, target: PolicyTarget) {
  if (target.userId === actor.userId || target.isOwner || target.accessLevel === "supreme") return false;
  if (target.accessLevel === "presidency") return actor.accessLevel === "supreme";
  if (target.accessLevel === "master") return actor.accessLevel === "supreme" || actor.accessLevel === "presidency";
  return isMasterLevel(actor) || actor.permissions.includes("users_manage");
}

const privilegedPermissions = new Set(["site_manage", "users_manage", "stores_manage", "stores_users", "stores_approve", "pretinha_moderate", "presidency"]);

export function canGrantPermissions(actor: PolicyActor, permissions: readonly string[]) {
  if (isMasterLevel(actor)) return true;
  return permissions.every((permission) => actor.permissions.includes(permission) && !privilegedPermissions.has(permission));
}

export function canApproveStore(actor: PolicyActor) {
  return isMasterLevel(actor) || actor.permissions.includes("stores_approve");
}

export function canEditStore(actor: PolicyActor, ownerUserId?: string) {
  return isMasterLevel(actor) || (actor.permissions.includes("stores") && ownerUserId === actor.userId);
}
