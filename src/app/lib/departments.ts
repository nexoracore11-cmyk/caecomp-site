import type { Admin } from "./auth";

export const departments = [
  "Presidência", "Secretaria", "Tesouraria", "Diretoria Acadêmica",
  "Diretoria de Eventos", "Diretoria de Marketing", "Diretoria de Produtos",
] as const;

const departmentPermission: Record<string, string> = {
  "Presidência": "presidency", Secretaria: "secretary", Tesouraria: "treasury",
  "Diretoria Acadêmica": "academic", "Diretoria de Eventos": "events",
  "Diretoria de Marketing": "marketing", "Diretoria de Produtos": "products",
};

export function canManageDepartment(admin: Pick<Admin, "accessLevel" | "isOwner" | "permissions">, department?: string) {
  if (admin.isOwner || ["master", "presidency", "supreme"].includes(admin.accessLevel)) return true;
  return Boolean(department && admin.permissions.includes(departmentPermission[department] as never));
}

export function canManageCalendar(admin: Pick<Admin, "accessLevel" | "isOwner" | "permissions">) {
  return admin.isOwner || ["master", "presidency", "supreme"].includes(admin.accessLevel)
    || ["events", "products", "academic", "marketing"].some((permission) => admin.permissions.includes(permission as never));
}
