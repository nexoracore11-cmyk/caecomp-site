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
      b("mustChangePassword", false),
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
      s("storeId", false, 36),
      t("metadata"),
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
      s("userId", false, 36),
      b("active", true),
      n("sortOrder"),
    ],
    indexes: [
      { key: "active_order", type: "key", columns: ["active", "sortOrder"] },
      { key: "user_idx", type: "key", columns: ["userId"] },
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
      s("campaignId", false, 36),
    ],
    indexes: [
      { key: "status_rank", type: "key", columns: ["status", "selectedRank"] },
      { key: "submission_time", type: "key", columns: ["submissionKey", "submittedAt"], orders: ["ASC", "DESC"] },
      { key: "submitted_at", type: "key", columns: ["submittedAt"], orders: ["DESC"] },
      { key: "campaign_rank_unique", type: "unique", columns: ["campaignId", "selectedRank"] },
    ],
  },
  {
    id: "store_profiles",
    name: "Vendinhas",
    columns: [s("name",true,128),s("slug",true,180),t("description"),s("whatsapp",false,32),s("phone",false,32),s("email",false,255),s("instagram",false,2048),s("logoUrl",false,2048),s("coverUrl",false,2048),s("ownerUserId",true,36),b("active",true),b("approved",true)],
    indexes: [{key:"slug_unique",type:"unique",columns:["slug"]},{key:"owner_idx",type:"key",columns:["ownerUserId"]},{key:"public_idx",type:"key",columns:["active","approved"]}],
  },
  {
    id: "calendar_items",
    name: "Calendário",
    columns: [s("title",true,255),t("summary"),d("startsAt",true),d("endsAt"),s("kind",true,32),s("department",false,128),s("sourceUrl",false,2048),s("createdBy",false,36),b("active",true)],
    indexes: [{key:"start_idx",type:"key",columns:["startsAt"]},{key:"public_start",type:"key",columns:["active","startsAt"]}],
  },
  {
    id: "photo_campaigns",
    name: "Olhares CAECOMP",
    columns: [s("title",true,160),s("slug",true,180),t("summary",true),t("description"),s("status",true,32),s("coverUrl",false,2048),n("selectionLimit",true),d("startsAt"),d("endsAt"),s("createdBy",true,36)],
    indexes: [{key:"slug_unique",type:"unique",columns:["slug"]},{key:"status_idx",type:"key",columns:["status"]}],
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
    queries: [Query.limit(500)],
    total: false,
  });
  const keys = new Set(existing.columns.map((c) => c.key));
  for (const column of def.columns)
    if (!keys.has(column.key)) await createColumn(def.id, column);
  for (let i = 0; i < 90; i++) {
    const current = await tables.listColumns({
      databaseId,
      tableId: def.id,
      queries: [Query.limit(500)],
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
  if(def.id==="pretinha_photos"&&indexes.indexes.some((index)=>index.key==="rank_unique")){
    await tables.deleteIndex({databaseId,tableId:def.id,key:"rank_unique"});
    await sleep(1000);
  }
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
      mustChangePassword: false,
    },
  });
const settings = {
  heroTitle: "Engenharia que conecta. Comunidade que transforma.",
  heroText:
    "O portal do Centro Acadêmico da Engenharia de Computação da UFG — representação, oportunidades, projetos e vida universitária em um só lugar.",
  aboutTitle: "Entidade estudantil de Engenharia de Computação",
  aboutText:
    "O Centro Acadêmico da Engenharia de Computação Weber Martins representa quem estuda Engenharia de Computação na UFG. O CAECOMP organiza demandas, constrói diálogo com a universidade e cria espaços para a formação, a convivência e a vida estudantil.",
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
    departments: true,
    calendar: true,
    instagram: true,
    about: true,
    history: false,
    photo_initiatives: true,
    journal: true,
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
  const missingSections={...(currentSettings.sections?.pretinha===undefined?{pretinha:true}:{}),...(currentSettings.sections?.photo_initiatives===undefined?{photo_initiatives:true}:{}),...(currentSettings.sections?.journal===undefined?{journal:true}:{}),...(currentSettings.sections?.departments===undefined?{departments:true}:{}),...(currentSettings.sections?.calendar===undefined?{calendar:true}:{})};
  const legacyAbout="O CAECOMP representa os estudantes de Engenharia de Computação e cria pontes com projetos, empresas e oportunidades.";
  const shouldRefreshCopy=currentSettings.aboutText===legacyAbout||currentSettings.aboutTitle==="Somos a voz de quem constrói o futuro";
  if (Object.keys(missingSections).length||shouldRefreshCopy)
    await tables.updateRow({
      databaseId,
      tableId: "site_settings",
      rowId: settingRows.rows[0].$id,
      data: { value: JSON.stringify({ ...currentSettings, ...(shouldRefreshCopy?{aboutTitle:settings.aboutTitle,aboutText:settings.aboutText}:{}), sections: { ...currentSettings.sections, ...missingSections } }) },
    });
}

const calendarRows=await tables.listRows({databaseId,tableId:"calendar_items",queries:[Query.limit(1)],total:false});
if(!calendarRows.rows.length){
 const official="https://sistemas.ufg.br/consultas_publicas/resolucoes/arquivos/Resolucao_CEPEC_2025_1966.pdf";
 const ufgEvents=[
  ["Início das aulas 2026/1","2026-03-02","2026-03-02"],["Paixão de Cristo","2026-04-03","2026-04-03"],["International Day na UFG","2026-04-09","2026-04-09"],["Tiradentes","2026-04-21","2026-04-21"],["Espaço das Profissões - Goiânia","2026-05-13","2026-05-14"],["Semana do meio ambiente na UFG","2026-06-01","2026-06-06"],["Corpus Christi","2026-06-04","2026-06-04"],["Término das aulas 2026/1","2026-07-04","2026-07-04"],["Período de inverno 2026/3","2026-07-06","2026-08-08"],["Início das aulas 2026/2","2026-08-10","2026-08-10"],["Independência do Brasil","2026-09-07","2026-09-07"],["CONEPEC","2026-10-13","2026-10-16"],["23º CONPEEX","2026-11-09","2026-11-13"],["Consciência Negra","2026-11-20","2026-11-20"],["Término das aulas 2026/2","2026-12-12","2026-12-12"]
 ];
 for(const [title,start,end] of ufgEvents)await tables.createRow({databaseId,tableId:"calendar_items",rowId:ID.unique(),data:{title,summary:"Calendário Acadêmico e Escolar da UFG 2026.",startsAt:`${start}T00:00:00.000Z`,endsAt:`${end}T23:59:59.000Z`,kind:"ufg",sourceUrl:official,createdBy:owner.$id,active:true}});
}

const administratorRows = await tables.listRows({ databaseId, tableId: "administrators", queries: [Query.limit(500)], total: false });
for (const row of administratorRows.rows) {
  const inferredLevel = row.isOwner ? "supreme" : (Array.isArray(row.permissions) && row.permissions.includes("site_manage") ? "master" : "member");
  if (row.accessLevel !== inferredLevel && (!row.accessLevel || row.isOwner))
    await tables.updateRow({ databaseId, tableId: "administrators", rowId: row.$id, data: { accessLevel: inferredLevel } });
}

const campaignRows = await tables.listRows({databaseId,tableId:"photo_campaigns",queries:[Query.equal("slug",["pretinha"]),Query.limit(1)],total:false});
let pretinhaCampaign = campaignRows.rows[0];
if(!pretinhaCampaign) pretinhaCampaign = await tables.createRow({databaseId,tableId:"photo_campaigns",rowId:ID.unique(),data:{title:"Pretinha",slug:"pretinha",summary:"Os melhores registros da Pretinha, a cachorra adotada pela comunidade da EMC.",description:"Envie seu melhor registro da Pretinha. A equipe do CAECOMP selecionará até 30 fotos para a galeria final.",status:"open",coverUrl:"/caecomp-logo-official.jpg",selectionLimit:30,createdBy:owner.$id}});
const legacyPhotos = await tables.listRows({databaseId,tableId:"pretinha_photos",queries:[Query.limit(500)],total:false});
for(const photo of legacyPhotos.rows) if(!photo.campaignId) await tables.updateRow({databaseId,tableId:"pretinha_photos",rowId:photo.$id,data:{campaignId:pretinhaCampaign.$id}});

const workshopRows=await tables.listRows({databaseId,tableId:"content_items",queries:[Query.equal("slug",["workshop-github-2026"]),Query.limit(1)],total:false});
if(!workshopRows.rows.length)await tables.createRow({databaseId,tableId:"content_items",rowId:ID.unique(),data:{module:"events",title:"Workshop GitHub",slug:"workshop-github-2026",summary:"Uma manhã de aplicação prática de conceitos de Git e GitHub com Gustavo Ferreira.",content:"Aprenda na prática conceitos de Git e GitHub com Gustavo Ferreira.\nO palestrante é especialista em Engenharia de Dados, trabalha com Python, MySQL, AWS e ETL, também atua com MLOps, Django, FastAPI e projetos no CEIA.\nHaverá coffee break após o evento. As vagas são limitadas.",imageUrl:"/event-media/workshop-github-1.webp",category:"Workshop",status:"published",startAt:"2026-09-03T09:00:00-03:00",endAt:"2026-09-03T12:00:00-03:00",location:"Auditório Professor Biolkino Pereira — EMC/UFG",price:0,capacityMode:"limited",ctaLabel:"Fazer inscrição",ctaUrl:"https://docs.google.com/forms/d/e/1FAIpQLSfPa3kIHE6PMDZ4kBE8Rl7k3M4C2l-kgEhJsHTJoXa0YUqXVA/viewform",sortOrder:0,metadata:JSON.stringify({registrationStatus:"open",changeNotice:"",isFree:true,lots:[{name:"Inscrição geral",price:0,status:"open"}],media:["/event-media/workshop-github-1.webp","/event-media/workshop-github-2.webp"],postEventMedia:[],registrationUrl:"https://docs.google.com/forms/d/e/1FAIpQLSfPa3kIHE6PMDZ4kBE8Rl7k3M4C2l-kgEhJsHTJoXa0YUqXVA/viewform",sourceUrl:"https://www.instagram.com/p/DceRLWmm4EV/"})}});

if(process.env.CAECOMP_PRESIDENCY_PASSWORD){
 const presidencyFound=await users.list({queries:[Query.equal("email",["cawemufg@gmail.com"])],total:false});
 const presidency=presidencyFound.users[0]??await users.create({userId:ID.unique(),email:"cawemufg@gmail.com",password:process.env.CAECOMP_PRESIDENCY_PASSWORD,name:"Presidência CAECOMP"});
 const presidencyRows=await tables.listRows({databaseId,tableId:"administrators",queries:[Query.equal("userId",[presidency.$id]),Query.limit(1)],total:false});
 if(!presidencyRows.rows.length)await tables.createRow({databaseId,tableId:"administrators",rowId:ID.unique(),data:{userId:presidency.$id,email:presidency.email,name:presidency.name,active:true,isOwner:false,accessLevel:"presidency",permissions:["site_manage","users_manage","presidency"],createdBy:owner.$id,mustChangePassword:false}});
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
