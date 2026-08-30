"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { permissionOptions } from "@/app/lib/permissions";
import { moduleEnabled, permissionEnabled, sectionEnabled } from "@/app/lib/module-visibility";
type Row = Record<string, unknown> & { $id: string };
type Admin = {
  userId: string;
  name: string;
  email: string;
  isOwner: boolean;
  accessLevel: "member" | "master" | "presidency" | "supreme";
  permissions: string[];
  mustChangePassword: boolean;
};
type Bootstrap = {
  admin: Admin;
  content: Row[];
  requests: Row[];
  users: Row[];
  directors: Row[];
  pretinha: Row[];
  stores: Row[];
  campaigns: Row[];
  calendar: Row[];
  settings: Record<string, unknown> | null;
};
const modules = [
  "news",
  "events",
  "ca_products",
  "stores",
  "documents",
  "gallery",
  "company_opportunities",
  "academic_opportunities",
  "department_posts",
];
const labels: Record<string, string> = {
  news: "Notícias",
  events: "Eventos",
  ca_products: "Produtos do CA",
  stores: "Vendinhas",
  documents: "Documentos",
  gallery: "Galeria",
  pretinha: "Pretinha",
  photo_initiatives: "Olhares CAECOMP",
  journal: "Jornal CAECOMP",
  company_opportunities: "Seleções de empresas",
  academic_opportunities: "Oportunidades acadêmicas",
  department_posts: "Publicações das diretorias",
  directors: "Membros atuais",
  departments: "Diretorias",
  calendar: "Calendário",
  instagram: "Instagram",
  about: "Quem somos",
  history: "Nossa história",
};

async function uploadAdminFile(file: File) {
  const upload = new FormData();
  upload.set("file", file);
  const response = await fetch("/api/admin/upload", { method: "POST", body: upload });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(String(result.error ?? "Não foi possível enviar o arquivo."));
  return String(result.url);
}

export function Dashboard() {
  const router = useRouter();
  const [data, setData] = useState<Bootstrap | null>(null);
  const [tab, setTab] = useState("overview");
  const [message, setMessage] = useState("");
  async function load() {
    const r = await fetch("/api/admin/bootstrap");
    if (r.ok) { const next=await r.json(); setData(next); if(next.admin.mustChangePassword)setTab("profile"); }
  }
  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/bootstrap").then(async (response) => {
      if (response.ok && !cancelled) { const next=await response.json(); setData(next); if(next.admin.mustChangePassword)setTab("profile"); }
    });
    return () => {
      cancelled = true;
    };
  }, []);
  async function call(url: string, method: string, body?: unknown) {
    setMessage("");
    const r = await fetch(url, {
      method,
      headers: body ? { "content-type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const j = await r.json().catch(() => ({}));
    setMessage(
      r.ok
        ? "Alteração salva com sucesso."
        : String(j.error ?? "Não foi possível salvar."),
    );
    if (r.ok) await load();
    return r.ok;
  }
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }
  if (!data) return <div className="admin-loading">Carregando painel...</div>;
  const isMaster = ["master", "presidency", "supreme"].includes(data.admin.accessLevel);
  const sections = (data.settings?.sections as Record<string, boolean>) ?? {};
  const sectionIsOn = (key:string) => sectionEnabled(sections, key);
  const requestsAreRelevant = ["ca_products", "stores", "events", "company_opportunities", "academic_opportunities"].some(sectionIsOn);
  const canUsers = isMaster || data.admin.permissions.includes("users_manage");
  const canCreateStoreUsers = sectionIsOn("stores") && (isMaster || data.admin.permissions.includes("stores_users"));
  const hasAny=(permissions:string[])=>isMaster||data.admin.permissions.includes("site_manage")||permissions.some((permission)=>data.admin.permissions.includes(permission));
  const visibleTabs=new Set(data.admin.mustChangePassword?["profile"]:["overview","profile"]);
  if(!data.admin.mustChangePassword&&["news","ca_products","documents","gallery","company_opportunities","academic_opportunities","departments"].some(sectionIsOn)&&hasAny(["news","products","documents","gallery","opportunities","academic","presidency","secretary","treasury","events","marketing"]))visibleTabs.add("content");
  if(!data.admin.mustChangePassword&&sectionIsOn("events")&&hasAny(["events"]))visibleTabs.add("events");
  if(!data.admin.mustChangePassword&&sectionIsOn("stores")&&hasAny(["stores","stores_manage"]))visibleTabs.add("stores");
  if(!data.admin.mustChangePassword&&canCreateStoreUsers)visibleTabs.add("store-users");
  if(!data.admin.mustChangePassword&&sectionIsOn("directors")&&hasAny(["presidency","secretary"]))visibleTabs.add("directors");
  if(!data.admin.mustChangePassword&&requestsAreRelevant&&hasAny(["requests","products","stores","events","opportunities"]))visibleTabs.add("requests");
  if(!data.admin.mustChangePassword&&hasAny(["marketing"]))visibleTabs.add("settings");
  if(!data.admin.mustChangePassword&&sectionIsOn("calendar")&&hasAny(["events","products","academic","marketing"]))visibleTabs.add("calendar");
  if(!data.admin.mustChangePassword&&sectionIsOn("photo_initiatives")&&isMaster)visibleTabs.add("pretinha");if(!data.admin.mustChangePassword&&canUsers)visibleTabs.add("users");
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div>
          <strong>CAECOMP</strong>
          <span>Central de gestão</span>
        </div>
        <nav>
          {[
            ["overview", "Visão geral"],
            ["content", "Conteúdos"],
            ["events", "Eventos"],
            ["calendar", "Calendário"],
            ["stores", "Vendinhas"],
            ["store-users", "Usuários de vendinhas"],
            ["directors", "Membros"],
            ["requests", "Solicitações"],
            ["pretinha", "Olhares CAECOMP"],
            ["settings", "Site e seções"],
            ["users", "Usuários"],
            ["profile", "Minha conta"],
          ]
            .filter(([id]) => visibleTabs.has(id))
            .map(([id, label]) => (
              <button
                key={id}
                className={tab === id ? "active" : ""}
                onClick={() => setTab(id)}
              >
                {label}
              </button>
            ))}
        </nav>
        <button onClick={logout}>Sair</button>
      </aside>
      <section className="admin-main">
        <header>
          <div>
            <span>Olá,</span>
            <h1>{data.admin.name}</h1>
          </div>
          <div className="owner-badge">
            {{ supreme: "Master Supremo", presidency: "Presidência", master: "Master", member: "Equipe CAECOMP" }[data.admin.accessLevel]}
          </div>
        </header>
        {message && <div className="admin-message">{message}</div>}
        {tab === "overview" && <Overview data={data} />}{" "}
        {tab === "content" && <ContentPanel rows={data.content} admin={data.admin} sections={sections} call={call} />}{" "}
        {tab === "events" && <EventsPanel rows={data.content.filter(row=>row.module==="events")} call={call} />}{" "}
        {tab === "calendar" && <CalendarPanel rows={data.calendar} call={call} />}{" "}
        {tab === "stores" && <StoresPanel stores={data.stores} products={data.content.filter(row=>row.module==="stores")} users={data.users} admin={data.admin} call={call} />}{" "}
        {tab === "store-users" && canCreateStoreUsers && <StoreUsersPanel call={call} />}{" "}
        {tab === "directors" && <Directors rows={data.directors} users={data.users} call={call} />}{" "}
        {tab === "requests" && <Requests rows={data.requests} call={call} />}{" "}
        {tab === "pretinha" && isMaster && <PretinhaPanel rows={data.pretinha} campaigns={data.campaigns} admin={data.admin} call={call} />}{" "}
        {tab === "settings" && (
          <Settings settings={data.settings} call={call} />
        )}{" "}
        {tab === "users" && canUsers && (
          <UsersPanel
            rows={data.users}
            actorLevel={data.admin.accessLevel}
            sections={sections}
            call={call}
          />
        )}{" "}
        {tab === "profile" && <Profile call={call} required={data.admin.mustChangePassword} />}
      </section>
    </div>
  );
}
function Overview({ data }: { data: Bootstrap }) {
  return (
    <div>
      <div className="admin-title">
        <span className="kicker">Resumo</span>
        <h2>O portal em um relance</h2>
      </div>
      <div className="stat-grid">
        <article>
          <strong>{data.content.length}</strong>
          <span>Conteúdos cadastrados</span>
        </article>
        <article>
          <strong>
            {data.requests.filter((r) => r.status === "new").length}
          </strong>
          <span>Novas solicitações</span>
        </article>
        <article>
          <strong>{data.users.length}</strong>
          <span>Usuários da equipe</span>
        </article>
        <article>
          <strong>
            {
              Object.values(
                (data.settings?.sections as Record<string, boolean>) ?? {},
              ).filter(Boolean).length
            }
          </strong>
          <span>Seções ativas</span>
        </article>
      </div>
      <div className="admin-card">
        <h3>Permissões desta conta</h3>
        <div className="tag-list">
          {["master", "presidency", "supreme"].includes(data.admin.accessLevel) ? (
            <span>Todas as permissões do site + nível {data.admin.accessLevel}</span>
          ) : (
            data.admin.permissions.map((p) => (
              <span key={p}>
                {permissionOptions.find((o) => o[0] === p)?.[1] ?? p}
              </span>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
function ContentPanel({
  rows,
  admin,
  sections,
  call,
}: {
  rows: Row[];
  admin: Admin;
  sections: Record<string, boolean>;
  call: (u: string, m: string, b?: unknown) => Promise<boolean>;
}) {
  const [open, setOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState("news");
  const master = ["master", "presidency", "supreme"].includes(admin.accessLevel);
  const modulePermissions:Record<string,string>={news:"news",events:"events",ca_products:"products",stores:"stores",documents:"documents",gallery:"gallery",company_opportunities:"opportunities",academic_opportunities:"academic"};
  const availableModules=modules.filter((module)=>moduleEnabled(sections,module)&&!['events','stores'].includes(module)&&(module==="department_posts"?master||["presidency","secretary","treasury","academic","events","marketing","products"].some(permission=>admin.permissions.includes(permission)):master||admin.permissions.includes("site_manage")||admin.permissions.includes(modulePermissions[module])));
  const activeModule=availableModules.includes(selectedModule)?selectedModule:(availableModules[0]??"");
  const statusLabels: Record<string, string> = { draft: "Rascunho", pending: "Aguardando aprovação", published: "Publicado", rejected: "Não aprovado", archived: "Arquivado" };
  async function editStore(row: Row) {
    const title = prompt("Nome do produto:", String(row.title ?? ""));
    if (title === null) return;
    const summary = prompt("Descrição do produto:", String(row.summary ?? ""));
    if (summary === null) return;
    const price = prompt("Preço:", String(row.price ?? ""));
    if (price === null) return;
    const stockQty = prompt("Quantidade em estoque (deixe vazio se ilimitado):", String(row.stockQty ?? ""));
    if (stockQty === null) return;
    await call(`/api/admin/content/${row.$id}`, "PATCH", { title, summary, price: price ? Number(price) : null, stockMode: stockQty ? "limited" : "unlimited", stockQty: stockQty ? Number(stockQty) : null });
  }
  async function editContent(row:Row){const title=prompt("Título:",String(row.title||""));if(title===null)return;const summary=prompt("Resumo:",String(row.summary||""));if(summary===null)return;const content=prompt("Texto (opcional):",String(row.content||""));if(content===null)return;await call(`/api/admin/content/${row.$id}`,"PATCH",{title,summary,content});}
  async function submit(f: FormData) {
    const body = Object.fromEntries(f.entries());
    const file = f.get("file");
    if (file instanceof File && file.size) {
      try {
        const url = await uploadAdminFile(file);
        if (file.type.startsWith("image/")) body.imageUrl = url;
        else body.documentUrl = url;
      } catch (error) {
        alert(error instanceof Error ? error.message : "Não foi possível enviar o arquivo.");
        return;
      }
    }
    delete body.file;
    const ok = await call("/api/admin/content", "POST", body);
    if (ok) setOpen(false);
  }
  return (
    <div>
      <div className="admin-title row">
        <div>
          <span className="kicker">Editorial</span>
          <h2>Conteúdos</h2>
        </div>
        <button className="button primary" onClick={() => setOpen(!open)}>
          Novo conteúdo
        </button>
      </div>
      {open && (
        <form action={submit} className="admin-form">
          <label>
            Módulo
            <select name="module" value={activeModule} onChange={(event) => setSelectedModule(event.target.value)}>
              {availableModules.map((m) => (
                <option key={m} value={m}>
                  {labels[m]}
                </option>
              ))}
            </select>
          </label>
          <label>
            Título
            <input name="title" required />
          </label>
          <label>
            Resumo
            <textarea name="summary" required rows={3} />
          </label>
          <label>Status<select name="status"><option value="draft">Rascunho</option><option value="published">Publicado</option></select></label>
          <label>
            Categoria
            {activeModule==="department_posts"?<select name="category"><option>Presidência</option><option>Secretaria</option><option>Tesouraria</option><option>Diretoria Acadêmica</option><option>Diretoria de Eventos</option><option>Diretoria de Marketing</option><option>Diretoria de Produtos</option></select>:<input name="category" />}
          </label>
          <label>
            Imagem (URL)
            <input name="imageUrl" />
          </label>
          <label>
            Documento/CTA (URL)
            <input name="documentUrl" />
          </label>
          <label>
            Enviar imagem ou documento
            <input
              name="file"
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf,.doc,.docx,.xls,.xlsx"
            />
          </label>
          <label>
            Preço
            <input name="price" type="number" step="0.01" />
          </label>
          <label>
            Estoque
            <select name="stockMode">
              <option value="">Não se aplica</option>
              <option value="limited">Limitado</option>
              <option value="unlimited">Ilimitado</option>
            </select>
          </label>
          <label>
            Quantidade em estoque
            <input name="stockQty" type="number" />
          </label>
          {activeModule === "stores" && <><label>Nome da vendinha<input name="ownerName" required /></label><label>WhatsApp da vendinha<input name="whatsapp" required /></label></>}
          <label>
            Data do evento
            <input name="startAt" type="datetime-local" />
          </label>
          <label>
            Local
            <input name="location" />
          </label>
          <label>
            Limite de ingressos/vagas
            <select name="capacityMode">
              <option value="">Não se aplica</option>
              <option value="limited">Limitado</option>
              <option value="unlimited">Ilimitado</option>
            </select>
          </label>
          <label>
            Quantidade de ingressos/vagas
            <input name="capacityQty" type="number" min="0" />
          </label>
          <button className="button primary">Cadastrar</button>
        </form>
      )}
      <div className="admin-table">
        {rows.map((r) => (
          <article key={r.$id}>
            <div>
              <span>{labels[String(r.module)] ?? String(r.module)}</span>
              <strong>{String(r.title)}</strong>
              <small>{statusLabels[String(r.status)] ?? String(r.status)}</small>
            </div>
            <div>
              {(r.module === "stores" ? (master || (r.ownerUserId === admin.userId && admin.permissions.includes("stores"))) : true) && <button onClick={() => r.module === "stores" ? void editStore(r) : void editContent(r)}>Editar</button>}
              {r.module === "ca_products" && r.stockMode === "limited" && (
                <button
                  disabled={Number(r.stockQty) <= 0}
                  onClick={() =>
                    call(`/api/admin/content/${r.$id}`, "PATCH", {
                      stockQty: Math.max(0, Number(r.stockQty) - 1),
                    })
                  }
                >
                  Venda −1 ({String(r.stockQty ?? 0)})
                </button>
              )}
              {(r.module !== "stores" || master || (r.ownerUserId===admin.userId&&admin.permissions.includes("stores"))) && <button
                onClick={() =>
                  call(`/api/admin/content/${r.$id}`, "PATCH", {
                    status: r.status === "published" ? "draft" : "published",
                  })
                }
              >
                {r.status === "published" ? "Retirar do site" : "Publicar"}
              </button>}
              {(r.module !== "stores" || master || (r.ownerUserId === admin.userId && admin.permissions.includes("stores"))) && <button
                className="danger"
                onClick={() =>
                  confirm("Excluir este conteúdo?") &&
                  call(`/api/admin/content/${r.$id}`, "DELETE")
                }
              >
                Excluir
              </button>}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
function EventsPanel({rows,call}:{rows:Row[];call:(u:string,m:string,b?:unknown)=>Promise<boolean>}){
  const [open,setOpen]=useState(false);
  const [editing,setEditing]=useState<Row|null>(null);
  async function submit(f:FormData){
    const poster=f.get("poster");const info=f.get("infoImage");const media:string[]=[];
    try{if(poster instanceof File&&poster.size)media.push(await uploadAdminFile(poster));if(info instanceof File&&info.size)media.push(await uploadAdminFile(info));}catch(error){alert(error instanceof Error?error.message:"Falha no envio das imagens.");return}
    const lots=String(f.get("lots")||"").split("\n").map(line=>line.trim()).filter(Boolean).map(line=>{const [name,price,status]=line.split("|").map(v=>v.trim());return {name,price:price?Number(price):0,status:status||"open"}});
    const body={module:"events",title:String(f.get("title")),summary:String(f.get("summary")),content:String(f.get("content")||""),status:String(f.get("status")||"draft"),startAt:String(f.get("startAt")||""),endAt:String(f.get("endAt")||""),location:String(f.get("location")||""),capacityMode:String(f.get("capacityMode")||"unlimited"),capacityQty:String(f.get("capacityQty")||""),ctaLabel:"Fazer inscrição",ctaUrl:String(f.get("registrationUrl")||""),imageUrl:media[0]||"",metadata:JSON.stringify({registrationStatus:String(f.get("registrationStatus")||"open"),changeNotice:String(f.get("changeNotice")||""),isFree:f.get("isFree")==="true",lots,media,postEventMedia:String(f.get("postEventMedia")||"").split("\n").map(v=>v.trim()).filter(Boolean),registrationUrl:String(f.get("registrationUrl")||"")})};
    if(await call("/api/admin/content","POST",body))setOpen(false);
  }
  return <div><div className="admin-title row"><div><span className="kicker">Agenda completa</span><h2>Eventos</h2></div><button className="button primary" onClick={()=>{setEditing(null);setOpen(!open)}}>Novo evento</button></div>{editing&&<EventEditor row={editing} call={call} onClose={()=>setEditing(null)}/>} {open&&!editing&&<form action={submit} className="admin-form"><label>Título<input name="title" required/></label><label>Resumo<textarea name="summary" required/></label><label className="full">Descrição<textarea name="content" rows={5}/></label><label>Status no site<select name="status"><option value="draft">Rascunho</option><option value="published">Publicado</option></select></label><label>Inscrições<select name="registrationStatus"><option value="open">Abertas</option><option value="closed">Encerradas</option><option value="sold_out">Esgotadas</option></select></label><label>Início<input name="startAt" type="datetime-local" required/></label><label>Fim<input name="endAt" type="datetime-local"/></label><label>Local<input name="location"/></label><label>Tipo<select name="isFree"><option value="true">Gratuito</option><option value="false">Pago</option></select></label><label>Capacidade<select name="capacityMode"><option value="unlimited">Ilimitada</option><option value="limited">Limitada</option></select></label><label>Quantidade de vagas<input name="capacityQty" type="number" min="0"/></label><label className="full">Link do formulário de inscrição<input name="registrationUrl" type="url"/></label><label>Cartaz<input name="poster" type="file" accept="image/jpeg,image/png,image/webp"/></label><label>Segunda imagem<input name="infoImage" type="file" accept="image/jpeg,image/png,image/webp"/></label><label className="full">Lotes (um por linha: Nome | valor | open/closed/sold_out)<textarea name="lots" rows={4} placeholder="1º lote | 15,00 | open"/></label><label className="full">Aviso de mudança<textarea name="changeNotice" placeholder="Só preencha quando houver uma alteração importante."/></label><label className="full">Fotos/vídeos pós-evento (uma URL por linha)<textarea name="postEventMedia"/></label><button className="button primary">Salvar evento</button></form>}<div className="admin-table">{rows.map(row=><article key={row.$id}><div><span>Evento</span><strong>{String(row.title)}</strong><small>{row.startAt?new Date(String(row.startAt)).toLocaleString("pt-BR"):"Sem data"} · {String(row.status)}</small></div><div><button onClick={()=>{setOpen(false);setEditing(row)}}>Abrir e editar</button><button onClick={()=>call(`/api/admin/content/${row.$id}`,"PATCH",{status:row.status==="published"?"draft":"published"})}>{row.status==="published"?"Retirar do site":"Publicar"}</button></div></article>)}</div></div>
}

function EventEditor({row,call,onClose}:{row:Row;call:(u:string,m:string,b?:unknown)=>Promise<boolean>;onClose:()=>void}){
  let meta:Record<string,unknown>={};try{meta=JSON.parse(String(row.metadata||"{}"))}catch{}
  const localDate=(value:unknown)=>{if(!value)return "";const date=new Date(String(value));if(Number.isNaN(date.getTime()))return "";return new Date(date.getTime()-date.getTimezoneOffset()*60000).toISOString().slice(0,16)};
  async function submit(form:FormData){
    const media=String(form.get("media")||"").split("\n").map(value=>value.trim()).filter(Boolean);
    try{for(const key of ["poster","additionalImage"]){const file=form.get(key);if(file instanceof File&&file.size)media.push(await uploadAdminFile(file));}}catch(error){alert(error instanceof Error?error.message:"Falha no envio das imagens.");return}
    const lots=String(form.get("lots")||"").split("\n").map(line=>line.trim()).filter(Boolean).map(line=>{const [name,price,status]=line.split("|").map(value=>value.trim());return {name,price:price?Number(price.replace(",",".")):0,status:["open","closed","sold_out"].includes(status)?status:"open"}});
    const body={title:String(form.get("title")),summary:String(form.get("summary")),content:String(form.get("content")||""),status:String(form.get("status")),startAt:String(form.get("startAt")),endAt:String(form.get("endAt")||""),location:String(form.get("location")||""),capacityMode:String(form.get("capacityMode")),capacityQty:String(form.get("capacityQty")||""),ctaLabel:"Inscrição pelo formulário",ctaUrl:String(form.get("registrationUrl")||""),imageUrl:media[0]||String(row.imageUrl||""),metadata:JSON.stringify({registrationStatus:String(form.get("registrationStatus")),changeNotice:String(form.get("changeNotice")||""),isFree:form.get("isFree")==="true",lots,media,postEventMedia:String(form.get("postEventMedia")||"").split("\n").map(value=>value.trim()).filter(Boolean),registrationUrl:String(form.get("registrationUrl")||"")})};
    if(await call(`/api/admin/content/${row.$id}`,"PATCH",body))onClose();
  }
  const lots=Array.isArray(meta.lots)?meta.lots.map((lot:unknown)=>{const value=lot as {name?:string;price?:number;status?:string};return `${value.name||""} | ${value.price??""} | ${value.status||"open"}`}).join("\n"):"";
  const media=Array.isArray(meta.media)?meta.media.map(String).join("\n"):String(row.imageUrl||"");
  return <form action={submit} className="admin-form"><div className="form-heading"><strong>Editar evento</strong><span>Atualize todas as informações, a disponibilidade e as imagens. A inscrição permanece somente no formulário externo.</span></div><label>Título<input name="title" defaultValue={String(row.title||"")} required/></label><label>Resumo<textarea name="summary" defaultValue={String(row.summary||"")} required/></label><label className="full">Descrição<textarea name="content" rows={6} defaultValue={String(row.content||"")}/></label><label>Status no site<select name="status" defaultValue={String(row.status||"draft")}><option value="draft">Rascunho</option><option value="published">Publicado</option></select></label><label>Inscrições<select name="registrationStatus" defaultValue={String(meta.registrationStatus||"open")}><option value="open">Abertas</option><option value="closed">Encerradas</option><option value="sold_out">Esgotadas</option></select></label><label>Início<input name="startAt" type="datetime-local" defaultValue={localDate(row.startAt)} required/></label><label>Fim<input name="endAt" type="datetime-local" defaultValue={localDate(row.endAt)}/></label><label>Local<input name="location" defaultValue={String(row.location||"")}/></label><label>Tipo<select name="isFree" defaultValue={meta.isFree===false?"false":"true"}><option value="true">Gratuito</option><option value="false">Pago</option></select></label><label>Capacidade<select name="capacityMode" defaultValue={String(row.capacityMode||"unlimited")}><option value="unlimited">Ilimitada</option><option value="limited">Limitada</option></select></label><label>Quantidade de vagas<input name="capacityQty" type="number" min="0" defaultValue={String(row.capacityQty||"")}/></label><label className="full">Link do formulário de inscrição<input name="registrationUrl" type="url" defaultValue={String(meta.registrationUrl||row.ctaUrl||"")}/></label><label className="full">Imagens do evento (uma URL por linha; mantém o tamanho completo)<textarea name="media" rows={4} defaultValue={media}/></label><label>Acrescentar cartaz<input name="poster" type="file" accept="image/jpeg,image/png,image/webp"/></label><label>Acrescentar outra imagem<input name="additionalImage" type="file" accept="image/jpeg,image/png,image/webp"/></label><label className="full">Lotes (um por linha: Nome | valor | open/closed/sold_out)<textarea name="lots" rows={4} defaultValue={lots}/></label><label className="full">Aviso de mudança<textarea name="changeNotice" defaultValue={String(meta.changeNotice||"")} placeholder="Preencha quando houver uma alteração importante."/></label><label className="full">Fotos/vídeos pós-evento (uma URL por linha)<textarea name="postEventMedia" defaultValue={Array.isArray(meta.postEventMedia)?meta.postEventMedia.map(String).join("\n"):""}/></label><button className="button primary">Salvar alterações</button><button type="button" className="button" onClick={onClose}>Cancelar</button></form>
}

function StoreUsersPanel({call}:{call:(u:string,m:string,b?:unknown)=>Promise<boolean>}){
  const [open,setOpen]=useState(false);
  async function submit(form:FormData){if(await call("/api/admin/store-users","POST",Object.fromEntries(form.entries())))setOpen(false)}
  return <div><div className="admin-title row"><div><span className="kicker">Acesso limitado</span><h2>Usuários de vendinhas</h2></div><button className="button primary" onClick={()=>setOpen(!open)}>Cadastrar usuário</button></div><div className="admin-card"><p className="admin-subtitle">Esta tela cria apenas uma conta de responsável por vendinha. Ela recebe somente a permissão para gerenciar a própria loja, sem acesso a usuários, conteúdo geral ou configurações.</p></div>{open&&<form action={submit} className="admin-form one"><label>Nome<input name="name" required/></label><label>E-mail<input name="email" type="email" required/></label><label>Senha inicial<input name="password" type="password" minLength={8} required/></label><div className="form-heading"><span>No primeiro acesso, a pessoa deverá trocar esta senha. Use pelo menos 8 caracteres, uma letra maiúscula, uma minúscula e um número.</span></div><button className="button primary">Criar acesso de vendinha</button></form>}</div>
}

function CalendarPanel({rows,call}:{rows:Row[];call:(u:string,m:string,b?:unknown)=>Promise<boolean>}){const [open,setOpen]=useState(false);async function submit(form:FormData){const body=Object.fromEntries(form.entries());if(await call("/api/admin/calendar","POST",body))setOpen(false)}return <div><div className="admin-title row"><div><span className="kicker">Agenda compartilhada</span><h2>Calendário</h2></div><button className="button primary" onClick={()=>setOpen(!open)}>Adicionar data</button></div>{open&&<form action={submit} className="admin-form"><label>Título<input name="title" required/></label><label>Tipo<select name="kind"><option value="caecomp">CAECOMP</option><option value="ufg">UFG</option></select></label><label>Início<input name="startsAt" type="datetime-local" required/></label><label>Fim<input name="endsAt" type="datetime-local"/></label><label>Diretoria (opcional)<input name="department"/></label><label>Fonte/link (opcional)<input name="sourceUrl" type="url"/></label><label className="full">Descrição<textarea name="summary"/></label><button className="button primary">Salvar data</button></form>}<div className="admin-table">{rows.map(row=><article key={row.$id}><div><span>{String(row.kind)==="ufg"?"UFG":String(row.department||"CAECOMP")}</span><strong>{String(row.title)}</strong><small>{new Date(String(row.startsAt)).toLocaleString("pt-BR")}</small></div><div><button className="danger" onClick={()=>confirm("Excluir esta data?")&&call(`/api/admin/calendar/${row.$id}`,"DELETE")}>Excluir</button></div></article>)}</div></div>}

function StoresPanel({stores,products,users,admin,call}:{stores:Row[];products:Row[];users:Row[];admin:Admin;call:(u:string,m:string,b?:unknown)=>Promise<boolean>}){
 const [newStore,setNewStore]=useState(false);const [newProduct,setNewProduct]=useState(false);const master=["master","presidency","supreme"].includes(admin.accessLevel)||admin.permissions.includes("stores_manage");const canApprove=false;const canManageOwn=master||admin.permissions.includes("stores");
 async function createStore(f:FormData){const body=Object.fromEntries(f.entries()) as Record<string,unknown>;for(const key of ["logo","cover"]){const file=f.get(key);if(file instanceof File&&file.size){try{body[key==="logo"?"logoUrl":"coverUrl"]=await uploadAdminFile(file)}catch(error){alert(error instanceof Error?error.message:"Falha no envio.");return}}delete body[key]}body.active=true;body.approved=true;if(await call("/api/admin/stores","POST",body))setNewStore(false)}
 async function createProduct(f:FormData){if(!confirm("Por segurança, não publique Pix ou instruções de pagamento. Combine qualquer pagamento apenas pelos contatos da vendinha. Continuar?"))return;const body=Object.fromEntries(f.entries()) as Record<string,unknown>;const image=f.get("image");if(image instanceof File&&image.size){try{body.imageUrl=await uploadAdminFile(image)}catch(error){alert(error instanceof Error?error.message:"Falha no envio.");return}}delete body.image;body.module="stores";body.status=String(body.status||"published");body.stockMode=body.stockMode==="limited"?"limited":"unlimited";if(await call("/api/admin/content","POST",body))setNewProduct(false)}
 async function editStore(row:Row){const name=prompt("Nome da vendinha:",String(row.name||""));if(!name)return;const description=prompt("Descrição:",String(row.description||""));if(description===null)return;const whatsapp=prompt("WhatsApp:",String(row.whatsapp||""));if(whatsapp===null)return;await call(`/api/admin/stores/${row.$id}`,"PATCH",{name,description,whatsapp})}
 async function editProduct(row:Row){const title=prompt("Produto:",String(row.title||""));if(!title)return;const summary=prompt("Descrição:",String(row.summary||""));if(summary===null)return;const price=prompt("Preço:",String(row.price||""));if(price===null)return;const stock=prompt("Estoque (vazio = ilimitado):",String(row.stockQty||""));if(stock===null)return;await call(`/api/admin/content/${row.$id}`,"PATCH",{title,summary,price:price?Number(price):null,stockMode:stock?"limited":"unlimited",stockQty:stock?Number(stock):null})}
 return <div><div className="admin-title row"><div><span className="kicker">Lojas virtuais</span><h2>Vendinhas</h2></div><div>{master&&<button className="button" onClick={()=>setNewStore(!newStore)}>Cadastrar vendinha</button>}{canManageOwn&&<button className="button primary" disabled={!stores.length} onClick={()=>setNewProduct(!newProduct)}>Novo produto</button>}</div></div>{newStore&&<form action={createStore} className="admin-form"><label>Nome<input name="name" required/></label><label>Responsável<select name="ownerUserId" required><option value="">Selecione</option>{users.filter(u=>Array.isArray(u.permissions)&&u.permissions.includes("stores")).map(u=><option value={String(u.userId)} key={u.$id}>{String(u.name)} · {String(u.email)}</option>)}</select></label><label className="full">Descrição<textarea name="description"/></label><label>WhatsApp<input name="whatsapp"/></label><label>Instagram oficial<input name="instagram" type="url"/></label><label>Logo<input name="logo" type="file" accept="image/jpeg,image/png,image/webp"/></label><label>Imagem de capa (opcional)<input name="cover" type="file" accept="image/jpeg,image/png,image/webp"/></label><button className="button primary">Criar vendinha</button></form>}{newProduct&&<form action={createProduct} className="admin-form"><label>Vendinha<select name="storeId" required>{stores.map(s=><option value={s.$id} key={s.$id}>{String(s.name)}</option>)}</select></label><label>Produto<input name="title" required/></label><label className="full">Descrição<textarea name="summary" required/></label><label>Preço<input name="price" type="number" step="0.01"/></label><label>Estoque (vazio = ilimitado)<input name="stockQty" type="number" min="0"/></label><label>Imagem<input name="image" type="file" accept="image/jpeg,image/png,image/webp"/></label>{master&&<label>Status<select name="status"><option value="pending">Aguardar aprovação</option><option value="published">Publicar agora</option></select></label>}<button className="button primary">Salvar produto</button></form>}<div className="admin-card"><h3>Minhas lojas e lojas cadastradas</h3><div className="admin-table">{stores.map(store=><article key={store.$id}><div><span>{store.approved?"Aprovada":"Aguardando aprovação"}</span><strong>{String(store.name)}</strong><small>{String(store.whatsapp||"Sem WhatsApp")}</small></div><div>{(master||store.ownerUserId===admin.userId)&&<button onClick={()=>void editStore(store)}>Editar loja</button>}{master&&<button onClick={()=>call(`/api/admin/stores/${store.$id}`,"PATCH",{approved:!store.approved})}>{store.approved?"Suspender":"Aprovar"}</button>}</div></article>)}</div></div><div className="admin-card"><h3>Produtos</h3><div className="admin-table">{products.map(row=><article key={row.$id}><div><span>{String(row.status)}</span><strong>{String(row.title)}</strong><small>{String(stores.find(s=>s.$id===row.storeId)?.name||"Vendinha")}</small></div><div>{(master||row.ownerUserId===admin.userId)&&<button onClick={()=>void editProduct(row)}>Editar</button>}{canApprove&&<button onClick={()=>call(`/api/admin/content/${row.$id}`,"PATCH",{status:row.status==="published"?"pending":"published"})}>{row.status==="published"?"Retirar":"Aprovar"}</button>}{(master||row.ownerUserId===admin.userId)&&<button className="danger" onClick={()=>confirm("Excluir produto?")&&call(`/api/admin/content/${row.$id}`,"DELETE")}>Excluir</button>}</div></article>)}</div></div></div>
}

function Directors({
  rows,
  users,
  call,
}: {
  rows: Row[];
  users: Row[];
  call: (u: string, m: string, b?: unknown) => Promise<boolean>;
}) {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState("");
  async function submit(form: FormData) {
    const body = Object.fromEntries(form.entries());
    const file = form.get("photo");
    if (file instanceof File && file.size) {
      try { body.photoUrl = await uploadAdminFile(file); }
      catch (error) { alert(error instanceof Error ? error.message : "Não foi possível enviar a foto."); return; }
    }
    delete body.photo;
    if (
      await call(
        "/api/admin/directors",
        "POST",
        body,
      )
    )
      setOpen(false);
  }
  return (
    <div>
      <div className="admin-title row">
        <div>
          <span className="kicker">Gestão atual</span>
          <h2>Membros da diretoria</h2>
        </div>
        <button className="button primary" onClick={() => setOpen(!open)}>
          Adicionar membro
        </button>
      </div>
      {open && (
        <form action={submit} className="admin-form">
          <label>
            Nome
            <input name="name" required />
          </label>
          <label>
            Cargo
            <input name="role" required />
          </label>
          <label>
            Diretoria
            <select name="department">
              {[
                "Presidência",
                "Secretaria",
                "Tesouraria",
                "Acadêmico",
                "Eventos",
                "Marketing",
                "Produtos",
              ].map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </label>
          <label>
            Vincular ao usuário (opcional)
            <select name="userId"><option value="">Sem vínculo</option>{users.map(user=><option key={user.$id} value={String(user.userId)}>{String(user.name)} · {String(user.email)}</option>)}</select>
          </label>
          <label>
            Foto (URL)
            <input name="photoUrl" />
          </label>
          <label>
            Ou enviar foto
            <input name="photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event)=>{const file=event.currentTarget.files?.[0];setPreview(file?URL.createObjectURL(file):"");}} />
          </label>
          {preview&&<img className="director-photo" src={preview} alt="Prévia da foto do membro" />}
          <label>
            WhatsApp (opcional)
            <input name="whatsapp" />
          </label>
          <label>
            LinkedIn (opcional)
            <input name="linkedin" type="url" />
          </label>
          <label>
            Lattes (opcional)
            <input name="lattes" type="url" />
          </label>
          <label>
            Instagram (opcional)
            <input name="instagram" type="url" />
          </label>
          <button className="button primary">Salvar membro</button>
        </form>
      )}
      <div className="admin-table">
        {rows.map((r) => (
          <article key={r.$id}>
            <div>
              <span>{String(r.department)}</span>
              <strong>{String(r.name)}</strong>
              <small>{String(r.role)}</small>
            </div>
            <div>
              <button
                onClick={() =>
                  call(`/api/admin/directors/${r.$id}`, "PATCH", {
                    active: !r.active,
                  })
                }
              >
                {r.active ? "Ocultar" : "Ativar"}
              </button>
              <button
                className="danger"
                onClick={() =>
                  confirm("Remover este membro?") &&
                  call(`/api/admin/directors/${r.$id}`, "DELETE")
                }
              >
                Excluir
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
function Requests({
  rows,
  call,
}: {
  rows: Row[];
  call: (u: string, m: string, b?: unknown) => Promise<boolean>;
}) {
  return (
    <div>
      <div className="admin-title">
        <span className="kicker">Atendimento</span>
        <h2>Solicitações recebidas</h2>
      </div>
      <div className="admin-table">
        {rows.length ? (
          rows.map((r) => (
            <article key={r.$id}>
              <div>
                <span>{String(r.kind)}</span>
                <strong>
                  {String(r.name)} · {String(r.quantity)} un.
                </strong>
                <small>
                  {String(r.whatsapp)} · {String(r.status)}
                </small>
              </div>
              <select
                value={String(r.status)}
                onChange={(e) =>
                  call(`/api/admin/requests/${r.$id}`, "PATCH", {
                    status: e.target.value,
                  })
                }
              >
                <option value="new">Nova</option>
                <option value="contacted">Contato feito</option>
                <option value="completed">Concluída</option>
                <option value="cancelled">Cancelada</option>
              </select>
            </article>
          ))
        ) : (
          <div className="empty">Nenhuma solicitação ainda.</div>
        )}
      </div>
    </div>
  );
}
function PretinhaPanel({
  rows,
  campaigns,
  admin,
  call,
}: {
  rows: Row[];
  campaigns: Row[];
  admin: Admin;
  call: (u: string, m: string, b?: unknown) => Promise<boolean>;
}) {
  const [campaignId,setCampaignId]=useState(String(campaigns[0]?.$id||""));
  const [open,setOpen]=useState(false);
  const campaign=campaigns.find(c=>c.$id===campaignId)??campaigns[0];
  const selectedRows=rows.filter(row=>row.campaignId===campaign?.$id);
  const approved = selectedRows.filter((row) => row.status === "approved").length;
  const pending = selectedRows.filter((row) => row.status === "pending").length;
  const limit=Number(campaign?.selectionLimit||30);
  async function createCampaign(f:FormData){const body=Object.fromEntries(f.entries());body.status="open";if(await call("/api/admin/campaigns","POST",body))setOpen(false)}
  return (
    <div>
      <div className="admin-title row"><div><span className="kicker">Iniciativas fotográficas</span><h2>Olhares CAECOMP</h2><p className="admin-subtitle">{pending} aguardando análise · {approved}/{limit} selecionadas</p></div><button className="button primary" onClick={()=>setOpen(!open)}>Nova edição</button></div>
      {open&&<form action={createCampaign} className="admin-form"><label>Título<input name="title" required placeholder="Ex.: Nosso prédio de aulas"/></label><label>Limite de fotos<input name="selectionLimit" type="number" min="1" max="100" defaultValue="30"/></label><label className="full">Resumo<textarea name="summary" required/></label><label className="full">Descrição<textarea name="description"/></label><label>Imagem de capa (URL)<input name="coverUrl"/></label><label>Encerramento automático<input name="endsAt" type="datetime-local"/></label><button className="button primary">Abrir iniciativa</button></form>}
      <div className="campaign-admin-bar"><label>Edição<select value={campaign?.$id||""} onChange={e=>setCampaignId(e.target.value)}>{campaigns.map(c=><option value={c.$id} key={c.$id}>{String(c.title)} · {String(c.status)}</option>)}</select></label>{campaign&&admin.accessLevel==="supreme"&&<div><button onClick={()=>call("/api/admin/campaigns/"+campaign.$id,"PATCH",{status:campaign.status==="open"?"closed":"open"})}>{campaign.status==="open"?"Finalizar envios":"Reabrir envios"}</button>{campaign.status!=="archived"&&<button onClick={()=>call("/api/admin/campaigns/"+campaign.$id,"PATCH",{status:"archived"})}>Arquivar edição</button>}</div>}</div>
      <div className="pretinha-admin-grid">
        {selectedRows.length ? selectedRows.map((row) => (
          <article key={row.$id} className={`pretinha-admin-card status-${String(row.status)}`}>
            <div className="pretinha-admin-image">
              <Image src={`/api/pretinha/${row.$id}/image`} fill sizes="(max-width: 900px) 100vw, 300px" alt={String(row.title || "Foto enviada da Pretinha")} />
              <span>{row.status === "approved" ? `Selecionada #${String(row.selectedRank)}` : row.status === "rejected" ? "Não selecionada" : "Aguardando"}</span>
            </div>
            <div className="pretinha-admin-copy">
              <h3>{String(row.title || "Sem título")}</h3>
              {Boolean(row.description) && <p>{String(row.description)}</p>}
              <small>Enviada em {new Date(String(row.submittedAt)).toLocaleString("pt-BR")}</small>
              <div className="pretinha-admin-actions">
                {row.status !== "approved" && <button disabled={approved >= limit} onClick={() => call(`/api/admin/pretinha/${row.$id}`, "PATCH", { status: "approved" })}>Selecionar</button>}
                {row.status === "approved" && <button onClick={() => call(`/api/admin/pretinha/${row.$id}`, "PATCH", { status: "pending" })}>Remover da seleção</button>}
                {row.status !== "rejected" && <button onClick={() => call(`/api/admin/pretinha/${row.$id}`, "PATCH", { status: "rejected" })}>Não selecionar</button>}
                <button className="danger" onClick={() => confirm("Excluir definitivamente esta foto e o arquivo?") && call(`/api/admin/pretinha/${row.$id}`, "DELETE")}>Excluir</button>
              </div>
            </div>
          </article>
        )) : <div className="empty">Nenhuma foto enviada ainda.</div>}
      </div>
    </div>
  );
}
function Settings({
  settings,
  call,
}: {
  settings: Record<string, unknown> | null;
  call: (u: string, m: string, b?: unknown) => Promise<boolean>;
}) {
  const [posts, setPosts] = useState<string[]>(
    (settings?.instagramPosts as string[]) ?? ["", "", ""],
  );
  const [sections, setSections] = useState<Record<string, boolean>>(
    (settings?.sections as Record<string, boolean>) ?? {},
  );
  return (
    <div>
      <div className="admin-title">
        <span className="kicker">Aparência e módulos</span>
        <h2>Site e seções</h2>
      </div>
      <div className="admin-card">
        <h3>Ativar ou desativar áreas públicas</h3>
        <div className="toggle-grid">
          {Object.entries(sections).filter(([key]) => key !== "pretinha").map(([key, value]) => (
            <label key={key}>
              <input
                type="checkbox"
                checked={value}
                onChange={(e) =>
                  setSections({ ...sections, [key]: e.target.checked })
                }
              />
              <span>{labels[key] ?? key}</span>
            </label>
          ))}
        </div>
        <button
          className="button primary"
          onClick={() => call("/api/admin/settings", "PATCH", { sections })}
        >
          Salvar seções
        </button>
      </div>
      <div className="admin-card">
        <h3>Três publicações do Instagram</h3>
        {posts.map((p, i) => (
          <label key={i}>
            URL da publicação {i + 1}
            <input
              value={p}
              onChange={(e) =>
                setPosts(posts.map((x, j) => (j === i ? e.target.value : x)))
              }
            />
          </label>
        ))}
        <button
          className="button primary"
          onClick={() =>
            call("/api/admin/settings", "PATCH", { instagramPosts: posts })
          }
        >
          Salvar Instagram
        </button>
      </div>
    </div>
  );
}
function UsersPanel({
  rows,
  actorLevel,
  sections,
  call,
}: {
  rows: Row[];
  actorLevel: "member" | "master" | "presidency" | "supreme";
  sections: Record<string, boolean>;
  call: (u: string, m: string, b?: unknown) => Promise<boolean>;
}) {
  const [open, setOpen] = useState(false);
  const [editingPermissions, setEditingPermissions] = useState<Row | null>(null);
  const levelLabels = { member: "Equipe", master: "Master", presidency: "Presidência", supreme: "Master Supremo" } as const;
  const creatableLevels = actorLevel === "supreme" ? ["member", "master", "presidency"] : actorLevel === "presidency" ? ["member", "master"] : ["member"];
  function mayManage(row: Row) {
    const target = row.isOwner ? "supreme" : String(row.accessLevel ?? "member");
    if (target === "supreme") return false;
    if (target === "presidency") return actorLevel === "supreme";
    if (target === "master") return actorLevel === "supreme" || actorLevel === "presidency";
    return true;
  }
  async function submit(f: FormData) {
    const permissions = f.getAll("permissions");
    const body = {
      ...Object.fromEntries(f.entries()),
      permissions,
      active: true,
    };
    if (await call("/api/admin/users", "POST", body)) setOpen(false);
  }
  return (
    <div>
      <div className="admin-title row">
        <div>
          <span className="kicker">Acessos acumuláveis</span>
          <h2>Usuários</h2>
        </div>
        <button className="button primary" onClick={() => setOpen(!open)}>
          Criar usuário
        </button>
      </div>
      {open && (
        <form action={submit} className="admin-form">
          <label>
            Nome
            <input name="name" required />
          </label>
          <label>
            E-mail
            <input name="email" type="email" required />
          </label>
          <label>
            Senha inicial
            <input name="password" type="password" minLength={8} required />
          </label>
          <label>
            Nível da conta
            <select name="accessLevel" defaultValue="member">
              {creatableLevels.map((level) => <option key={level} value={level}>{levelLabels[level as keyof typeof levelLabels]}</option>)}
            </select>
          </label>
          <fieldset>
            <legend>Permissões</legend>
            <div className="permission-grid">
              {permissionOptions.filter(([key]) => permissionEnabled(sections, key)).map(([key, label]) => (
                <label key={key}>
                  <input type="checkbox" name="permissions" value={key} />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>
          <button className="button primary">Criar conta</button>
        </form>
      )}
      {editingPermissions && <form key={editingPermissions.$id} action={async (form) => {
        const permissions = form.getAll("permissions");
        if (await call(`/api/admin/users/${editingPermissions.$id}`, "PATCH", { permissions })) setEditingPermissions(null);
      }} className="admin-form">
        <div className="form-heading"><strong>Permissões de {String(editingPermissions.name)}</strong><span>Marque “Aprovar produtos de vendinhas” somente para quem poderá liberar produtos no site.</span></div>
        <fieldset><legend>Permissões</legend><div className="permission-grid">{permissionOptions.filter(([key]) => permissionEnabled(sections, key)).map(([key, label]) => <label key={key}><input type="checkbox" name="permissions" value={key} defaultChecked={Array.isArray(editingPermissions.permissions) && editingPermissions.permissions.includes(key)} />{label}</label>)}</div></fieldset>
        <button className="button primary">Salvar permissões</button><button type="button" className="button" onClick={() => setEditingPermissions(null)}>Cancelar</button>
      </form>}
      <div className="admin-table">
        {rows.map((r) => (
          <article key={r.$id}>
            <div>
              <span>{levelLabels[(r.isOwner ? "supreme" : String(r.accessLevel ?? "member")) as keyof typeof levelLabels] ?? "Equipe"}</span>
              <strong>{String(r.name)}</strong>
              <small>{String(r.email)}</small>
            </div>
            {mayManage(r) && (
              <div>
                <button onClick={() => setEditingPermissions(r)}>Editar permissões</button>
                {actorLevel === "supreme" && <button
                  onClick={() => {
                    const password = prompt(
                      "Nova senha (mínimo 8 caracteres, com uma maiúscula, uma minúscula e um número):",
                    );
                    if (password)
                      void call(`/api/admin/users/${r.$id}`, "PATCH", {
                        password,
                      });
                  }}
                >
                  Redefinir senha
                </button>}
                <button onClick={() => call(`/api/admin/users/${r.$id}`, "PATCH", { active: !r.active })}>{r.active ? "Desativar" : "Ativar"}</button>
                <button
                  className="danger"
                  onClick={() =>
                    confirm("Excluir esta conta?") &&
                    call(`/api/admin/users/${r.$id}`, "DELETE")
                  }
                >
                  Excluir
                </button>
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
function Profile({
  call,
  required,
}: {
  call: (u: string, m: string, b?: unknown) => Promise<boolean>;
  required:boolean;
}) {
  async function submit(f: FormData) {
    await call("/api/admin/profile", "PATCH", Object.fromEntries(f.entries()));
  }
  return (
    <div>
      <div className="admin-title">
        <span className="kicker">Dados pessoais</span>
        <h2>Minha conta</h2>
        {required&&<p className="admin-subtitle">Por segurança, defina uma nova senha antes de acessar o restante do painel.</p>}
      </div>
      <form action={submit} className="admin-form one">
        <label>
          Novo nome
          <input name="name" />
        </label>
        <label>
          Novo e-mail
          <input name="email" type="email" />
        </label>
        <label>
          Senha atual
          <input name="currentPassword" type="password" />
        </label>
        <label>
          Nova senha
          <input name="newPassword" type="password" minLength={8} />
        </label>
        <button className="button primary">Atualizar minha conta</button>
      </form>
    </div>
  );
}
