import {
  Client,
  ID,
  Query,
  Storage,
  TablesDB,
  Users,
} from "node-appwrite";

const required = [
  "APPWRITE_ENDPOINT",
  "APPWRITE_PROJECT_ID",
  "APPWRITE_API_KEY",
  "APPWRITE_DATABASE_ID",
  "APPWRITE_STORAGE_BUCKET_ID",
  "CAECOMP_OWNER_EMAIL",
];
for (const key of required)
  if (!process.env[key])
    throw new Error(`Variável obrigatória ausente: ${key}`);
const databaseId = process.env.APPWRITE_DATABASE_ID;
const bucketId = process.env.APPWRITE_STORAGE_BUCKET_ID;
const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);
const tables = new TablesDB(client);
const storage = new Storage(client);
const users = new Users(client);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const missing = async (op) => {
  try {
    await op();
    return false;
  } catch (e) {
    if (e?.code === 404) return true;
    throw e;
  }
};
const s = (key, required = false, size = 255, array = false) => ({
  key,
  type: "string",
  required,
  size,
  array,
});
const t = (key, required = false) => ({ key, type: "text", required });
const b = (key, required = false) => ({ key, type: "boolean", required });
const n = (key, required = false) => ({ key, type: "integer", required });
const f = (key, required = false) => ({ key, type: "float", required });
const d = (key, required = false) => ({ key, type: "datetime", required });
const definitions = [
  {
    id: "administrators",
    name: "Administradores",
    columns: [
      s("userId", true, 36),
      s("email", true),
      s("name", true, 128),
      b("active", true),
      b("isOwner", true),
      s("accessLevel", false, 32),
      s("permissions", false, 64, true),
      s("createdBy", false, 36),
    ],
    indexes: [
      { key: "user_unique", type: "unique", columns: ["userId"] },
      { key: "email_unique", type: "unique", columns: ["email"] },
      { key: "active_idx", type: "key", columns: ["active"] },
    ],
  },
  {
    id: "content_items",
    name: "Conteúdos",
    columns: [
      s("module", true, 64),
      s("title", true, 255),
      s("slug", true, 255),
      t("summary", true),
      t("content"),
      s("imageUrl", false, 2048),
      s("documentUrl", false, 2048),
      s("category", false, 100),
      s("status", true, 32),
      d("startAt"),
      d("endAt"),
      s("location"),
      f("price"),
      s("stockMode", false, 32),
      n("stockQty"),
      s("capacityMode", false, 32),
      n("capacityQty"),
      s("ctaLabel", false, 100),
      s("ctaUrl", false, 2048),
      s("ownerName", false, 128),
      s("whatsapp", false, 32),
      s("ownerUserId", false, 36),
      s("reviewedBy", false, 36),
      d("reviewedAt"),
      n("sortOrder"),
    ],
    indexes: [
      { key: "slug_unique", type: "unique", columns: ["slug"] },
      { key: "module_status", type: "key", columns: ["module", "status"] },
      { key: "status_order", type: "key", columns: ["status", "sortOrder"] },
    ],
  },
  {
    id: "directors",
    name: "Diretoria",
    columns: [
      s("name", true, 128),
      s("role", true, 128),
      s("department", true, 128),
      s("photoUrl", false, 2048),
      s("whatsapp", false, 32),
      s("linkedin", false, 2048),
      s("lattes", false, 2048),
      s("instagram", false, 2048),
      b("active", true),
      n("sortOrder"),
    ],
    indexes: [
      { key: "active_order", type: "key", columns: ["active", "sortOrder"] },
    ],
  },
  {
    id: "requests",
    name: "Solicitações",
    columns: [
      s("itemId", true, 36),
      s("kind", true, 32),
      s("name", true, 128),
      s("whatsapp", true, 32),
      s("email"),
      n("quantity", true),
      t("details"),
      s("status", true, 32),
      s("assignedTo", false, 36),
      t("internalNotes"),
      s("submissionKey", false, 64),
      d("submittedAt"),
    ],
    indexes: [
      { key: "status_idx", type: "key", columns: ["status"] },
      { key: "item_idx", type: "key", columns: ["itemId"] },
      { key: "request_rate", type: "key", columns: ["submissionKey", "submittedAt"], orders: ["ASC", "DESC"] },
    ],
  },
  {
    id: "pretinha_photos",
    name: "Fotos da Pretinha",
    columns: [
      s("fileId", true, 36),
      s("title", false, 120),
      t("description"),
      s("mimeType", true, 64),
      s("status", true, 32),
      n("selectedRank"),
      d("submittedAt", true),
      d("reviewedAt"),
      s("reviewedBy", false, 36),
      s("submissionKey", true, 64),
    ],
    indexes: [
      { key: "status_rank", type: "key", columns: ["status", "selectedRank"] },
      { key: "submission_time", type: "key", columns: ["submissionKey", "submittedAt"], orders: ["ASC", "DESC"] },
      { key: "submitted_at", type: "key", columns: ["submittedAt"], orders: ["DESC"] },
      { key: "rank_unique", type: "unique", columns: ["selectedRank"] },
    ],
  },
  {
    id: "site_settings",
    name: "Configurações",
    columns: [s("key", true, 100), t("value", true)],
    indexes: [{ key: "key_unique", type: "unique", columns: ["key"] }],
  },
  {
    id: "audit_log",
    name: "Auditoria",
    columns: [
      s("actorId", true, 36),
      s("action", true, 64),
      s("resource", true, 64),
      s("resourceId", false, 36),
      t("details"),
    ],
    indexes: [{ key: "actor_idx", type: "key", columns: ["actorId"] }],
  },
];
async function createColumn(tableId, column) {
  const common = {
    databaseId,
    tableId,
    key: column.key,
    required: column.required,
    array: column.array ?? false,
  };
  if (column.type === "string")
    return tables.createStringColumn({ ...common, size: column.size });
  if (column.type === "text") return tables.createTextColumn(common);
  if (column.type === "boolean") return tables.createBooleanColumn(common);
  if (column.type === "integer") return tables.createIntegerColumn(common);
  if (column.type === "float") return tables.createFloatColumn(common);
  if (column.type === "datetime") return tables.createDatetimeColumn(common);
}
if (await missing(() => tables.get({ databaseId })))
  await tables.create({ databaseId, name: "CAECOMP Portal", enabled: true });
for (const def of definitions)
  if (await missing(() => tables.getTable({ databaseId, tableId: def.id })))
    await tables.createTable({
      databaseId,
      tableId: def.id,
      name: def.name,
      enabled: true,
    });
for (const def of definitions) {
  const existing = await tables.listColumns({
    databaseId,
    tableId: def.id,
    total: false,
  });
  const keys = new Set(existing.columns.map((c) => c.key));
  for (const column of def.columns)
    if (!keys.has(column.key)) await createColumn(def.id, column);
  for (let i = 0; i < 90; i++) {
    const current = await tables.listColumns({
      databaseId,
      tableId: def.id,
      total: false,
    });
    if (
      current.columns.length >= def.columns.length &&
      current.columns.every((c) => !c.status || c.status === "available")
    )
      break;
    if (i === 89) throw new Error(`Colunas de ${def.id} não ficaram prontas`);
    await sleep(1000);
  }
  const indexes = await tables.listIndexes({
    databaseId,
    tableId: def.id,
    total: false,
  });
  const indexKeys = new Set(indexes.indexes.map((i) => i.key));
  for (const index of def.indexes)
    if (!indexKeys.has(index.key))
      await tables.createIndex({ databaseId, tableId: def.id, ...index });
}
if (await missing(() => storage.getBucket({ bucketId })))
  await storage.createBucket({
    bucketId,
    name: "CAECOMP Mídia",
    permissions: [],
    enabled: true,
    maximumFileSize: 30000000,
    fileSecurity: false,
    allowedFileExtensions: [
      "jpg",
      "jpeg",
      "png",
      "webp",
      "pdf",
      "doc",
      "docx",
      "xls",
      "xlsx",
    ],
    encryption: true,
    transformations: true,
  });
else
  await storage.updateBucket({
    bucketId,
    name: "CAECOMP Mídia",
    permissions: [],
    fileSecurity: false,
    enabled: true,
    maximumFileSize: 30000000,
    allowedFileExtensions: [
      "jpg",
      "jpeg",
      "png",
      "webp",
      "pdf",
      "doc",
      "docx",
      "xls",
      "xlsx",
    ],
    encryption: true,
    transformations: true,
  });
let owner;
const found = await users.list({
  queries: [Query.equal("email", [process.env.CAECOMP_OWNER_EMAIL])],
  total: false,
});
if (!found.users[0] && !process.env.CAECOMP_OWNER_PASSWORD)
  throw new Error(
    "CAECOMP_OWNER_PASSWORD é obrigatória somente na criação inicial do proprietário.",
  );
owner =
  found.users[0] ??
  (await users.create({
    userId: ID.unique(),
    email: process.env.CAECOMP_OWNER_EMAIL,
    password: process.env.CAECOMP_OWNER_PASSWORD,
    name: process.env.CAECOMP_OWNER_NAME || "Proprietário CAECOMP",
  }));
const ownerRows = await tables.listRows({
  databaseId,
  tableId: "administrators",
  queries: [Query.equal("userId", [owner.$id]), Query.limit(1)],
  total: false,
});
if (!ownerRows.rows.length)
  await tables.createRow({
    databaseId,
    tableId: "administrators",
    rowId: ID.unique(),
    data: {
      userId: owner.$id,
      email: owner.email,
      name: owner.name,
      active: true,
      isOwner: true,
      permissions: ["site_manage", "users_manage"],
      accessLevel: "supreme",
      createdBy: owner.$id,
    },
  });
const settings = {
  heroTitle: "Engenharia que conecta. Comunidade que transforma.",
  heroText:
    "O portal do Centro Acadêmico da Engenharia de Computação da UFG — representação, oportunidades, projetos e vida universitária em um só lugar.",
  aboutTitle: "Somos a voz de quem constrói o futuro",
  aboutText:
    "O CAECOMP representa os estudantes de Engenharia de Computação e cria pontes com projetos, empresas e oportunidades.",
  historyText:
    "O Centro Acadêmico da Engenharia de Computação Weber Martins foi fundado em 20 de outubro de 2017.",
  sections: {
    news: true,
    events: true,
    ca_products: true,
    stores: true,
    documents: true,
    gallery: true,
    pretinha: true,
    company_opportunities: true,
    academic_opportunities: true,
    directors: true,
    instagram: true,
    about: true,
    history: true,
  },
  instagramPosts: [
    "https://www.instagram.com/caecompufg/",
    "https://www.instagram.com/caecompufg/",
    "https://www.instagram.com/caecompufg/",
  ],
};
const settingRows = await tables.listRows({
  databaseId,
  tableId: "site_settings",
  queries: [Query.equal("key", ["public"]), Query.limit(1)],
  total: false,
});
if (!settingRows.rows.length)
  await tables.createRow({
    databaseId,
    tableId: "site_settings",
    rowId: ID.unique(),
    data: { key: "public", value: JSON.stringify(settings) },
  });
else {
  const currentSettings = JSON.parse(String(settingRows.rows[0].value));
  if (currentSettings.sections?.pretinha === undefined)
    await tables.updateRow({
      databaseId,
      tableId: "site_settings",
      rowId: settingRows.rows[0].$id,
      data: { value: JSON.stringify({ ...currentSettings, sections: { ...currentSettings.sections, pretinha: true } }) },
    });
}

const administratorRows = await tables.listRows({ databaseId, tableId: "administrators", queries: [Query.limit(500)], total: false });
for (const row of administratorRows.rows) {
  const inferredLevel = row.isOwner ? "supreme" : (Array.isArray(row.permissions) && row.permissions.includes("site_manage") ? "master" : "member");
  if (row.accessLevel !== inferredLevel && (!row.accessLevel || row.isOwner))
    await tables.updateRow({ databaseId, tableId: "administrators", rowId: row.$id, data: { accessLevel: inferredLevel } });
}
console.log(
  JSON.stringify({
    ok: true,
    database: databaseId,
    tables: definitions.length,
    bucket: bucketId,
    owner: "ready",
  }),
);
