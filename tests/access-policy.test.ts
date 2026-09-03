import assert from "node:assert/strict";
import test from "node:test";
import { canApproveStore, canCreateLevel, canEditStore, canGrantPermissions, canManageTarget } from "../src/app/lib/access-policy.ts";
import { saoPauloDateTimeInput, saoPauloLocalToIso } from "../src/app/lib/date-time.ts";

const actor = (accessLevel: "member"|"master"|"presidency"|"supreme", permissions: string[] = []) => ({ userId: accessLevel, isOwner: accessLevel === "supreme", accessLevel, permissions });

test("master comum não altera outro master", () => {
  assert.equal(canManageTarget(actor("master"), { userId: "other", isOwner: false, accessLevel: "master" }), false);
});
test("presidência altera master, mas nunca o supremo", () => {
  assert.equal(canManageTarget(actor("presidency"), { userId: "master-2", isOwner: false, accessLevel: "master" }), true);
  assert.equal(canManageTarget(actor("presidency"), { userId: "supreme", isOwner: true, accessLevel: "supreme" }), false);
});
test("somente supremo cria presidência", () => {
  assert.equal(canCreateLevel(actor("presidency"), "presidency"), false);
  assert.equal(canCreateLevel(actor("supreme"), "presidency"), true);
});
test("presidência pode promover equipe para master, mas gestor de usuários só cria equipe", () => {
  assert.equal(canCreateLevel(actor("presidency"), "master"), true);
  assert.equal(canCreateLevel(actor("member", ["users_manage"]), "master"), false);
});
test("gestor não-master não repassa permissões privilegiadas", () => {
  const manager = actor("member", ["users_manage", "news"]);
  assert.equal(canGrantPermissions(manager, ["news"]), true);
  assert.equal(canGrantPermissions(manager, ["site_manage"]), false);
  assert.equal(canGrantPermissions(manager, ["stores_approve"]), false);
});
test("aprovação de vendinha é separada da edição", () => {
  const approver = actor("member", ["stores_approve"]);
  const seller = actor("member", ["stores"]);
  assert.equal(canApproveStore(approver), true);
  assert.equal(canEditStore(approver, "seller"), false);
  assert.equal(canEditStore(seller, "member"), true);
  assert.equal(canApproveStore(seller), false);
});

test("horário de Goiânia não perde três horas ao salvar e reabrir", () => {
  const stored = saoPauloLocalToIso("2026-09-03T09:00");
  assert.equal(stored, "2026-09-03T12:00:00.000Z");
  assert.equal(saoPauloDateTimeInput(stored), "2026-09-03T09:00");
});
