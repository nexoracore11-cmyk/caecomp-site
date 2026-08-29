"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { permissionOptions } from "@/app/lib/permissions";
type Row = Record<string, unknown> & { $id: string };
type Admin = {
  userId: string;
  name: string;
  email: string;
  isOwner: boolean;
  accessLevel: "member" | "master" | "presidency" | "supreme";
  permissions: string[];
};
type Bootstrap = {
  admin: Admin;
  content: Row[];
  requests: Row[];
  users: Row[];
  directors: Row[];
  pretinha: Row[];
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
];
const labels: Record<string, string> = {
  news: "Notícias",
  events: "Eventos",
  ca_products: "Produtos do CA",
  stores: "Vendinhas",
  documents: "Documentos",
  gallery: "Galeria",
  pretinha: "Pretinha",
  company_opportunities: "Seleções de empresas",
  academic_opportunities: "Oportunidades acadêmicas",
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
    if (r.ok) setData(await r.json());
  }
  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/bootstrap").then(async (response) => {
      if (response.ok && !cancelled) setData(await response.json());
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
  const canUsers = isMaster || data.admin.permissions.includes("users_manage");
  const hasAny=(permissions:string[])=>isMaster||data.admin.permissions.includes("site_manage")||permissions.some((permission)=>data.admin.permissions.includes(permission));
  const visibleTabs=new Set(["overview","profile"]);
  if(hasAny(["news","events","products","stores","documents","gallery","opportunities","academic"]))visibleTabs.add("content");
  if(hasAny(["presidency","secretary"]))visibleTabs.add("directors");
  if(hasAny(["requests","products","stores","events","opportunities"]))visibleTabs.add("requests");
  if(hasAny(["marketing"]))visibleTabs.add("settings");
  if(isMaster)visibleTabs.add("pretinha");if(canUsers)visibleTabs.add("users");
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
            ["directors", "Membros"],
            ["requests", "Solicitações"],
            ["pretinha", "Pretinha"],
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
        {tab === "content" && <ContentPanel rows={data.content} admin={data.admin} call={call} />}{" "}
        {tab === "directors" && <Directors rows={data.directors} call={call} />}{" "}
        {tab === "requests" && <Requests rows={data.requests} call={call} />}{" "}
        {tab === "pretinha" && isMaster && <PretinhaPanel rows={data.pretinha} call={call} />}{" "}
        {tab === "settings" && (
          <Settings settings={data.settings} call={call} />
        )}{" "}
        {tab === "users" && canUsers && (
          <UsersPanel
            rows={data.users}
            actorLevel={data.admin.accessLevel}
            call={call}
          />
        )}{" "}
        {tab === "profile" && <Profile call={call} />}
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
  call,
}: {
  rows: Row[];
  admin: Admin;
  call: (u: string, m: string, b?: unknown) => Promise<boolean>;
}) {
  const [open, setOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState("news");
  const master = ["master", "presidency", "supreme"].includes(admin.accessLevel);
  const canApproveStores = master || admin.permissions.includes("stores_approve");
  const modulePermissions:Record<string,string>={news:"news",events:"events",ca_products:"products",stores:"stores",documents:"documents",gallery:"gallery",company_opportunities:"opportunities",academic_opportunities:"academic"};
  const availableModules=modules.filter((module)=>master||admin.permissions.includes("site_manage")||admin.permissions.includes(modulePermissions[module]));
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
          {activeModule === "stores" && !canApproveStores ? <div className="approval-notice"><strong>Enviado para aprovação</strong><span>O produto só aparecerá no site após um master ou aprovador autorizado liberar.</span><input type="hidden" name="status" value="pending" /></div> : <label>Status<select name="status"><option value="draft">Rascunho</option>{activeModule === "stores" && <option value="pending">Aguardando aprovação</option>}<option value="published">Publicado</option>{activeModule === "stores" && <option value="rejected">Não aprovado</option>}</select></label>}
          <label>
            Categoria
            <input name="category" />
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
              {r.module === "stores" && (master || (r.ownerUserId === admin.userId && admin.permissions.includes("stores"))) && <button onClick={() => void editStore(r)}>Editar</button>}
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
              {(r.module !== "stores" || canApproveStores) && <button
                onClick={() =>
                  call(`/api/admin/content/${r.$id}`, "PATCH", {
                    status: r.status === "published" ? (r.module === "stores" ? "pending" : "draft") : "published",
                  })
                }
              >
                {r.status === "published" ? "Retirar do site" : r.module === "stores" ? "Aprovar" : "Publicar"}
              </button>}
              {r.module === "stores" && canApproveStores && r.status !== "rejected" && <button onClick={() => call(`/api/admin/content/${r.$id}`, "PATCH", { status: "rejected" })}>Não aprovar</button>}
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
function Directors({
  rows,
  call,
}: {
  rows: Row[];
  call: (u: string, m: string, b?: unknown) => Promise<boolean>;
}) {
  const [open, setOpen] = useState(false);
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
            Foto (URL)
            <input name="photoUrl" />
          </label>
          <label>
            Ou enviar foto
            <input name="photo" type="file" accept="image/jpeg,image/png,image/webp" />
          </label>
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
  call,
}: {
  rows: Row[];
  call: (u: string, m: string, b?: unknown) => Promise<boolean>;
}) {
  const approved = rows.filter((row) => row.status === "approved").length;
  const pending = rows.filter((row) => row.status === "pending").length;
  return (
    <div>
      <div className="admin-title">
        <span className="kicker">Seleção especial</span>
        <h2>Fotos da Pretinha</h2>
        <p className="admin-subtitle">{pending} aguardando análise · {approved}/30 selecionadas</p>
      </div>
      <div className="pretinha-admin-grid">
        {rows.length ? rows.map((row) => (
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
                {row.status !== "approved" && <button disabled={approved >= 30} onClick={() => call(`/api/admin/pretinha/${row.$id}`, "PATCH", { status: "approved" })}>Selecionar</button>}
                {row.status === "approved" && <button onClick={() => call(`/api/admin/pretinha/${row.$id}`, "PATCH", { status: "pending" })}>Remover das 30</button>}
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
          {Object.entries(sections).map(([key, value]) => (
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
  call,
}: {
  rows: Row[];
  actorLevel: "member" | "master" | "presidency" | "supreme";
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
            <input name="password" type="password" minLength={10} required />
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
              {permissionOptions.map(([key, label]) => (
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
        <fieldset><legend>Permissões</legend><div className="permission-grid">{permissionOptions.map(([key, label]) => <label key={key}><input type="checkbox" name="permissions" value={key} defaultChecked={Array.isArray(editingPermissions.permissions) && editingPermissions.permissions.includes(key)} />{label}</label>)}</div></fieldset>
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
                      "Nova senha (mínimo 10 caracteres, com letras e números):",
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
}: {
  call: (u: string, m: string, b?: unknown) => Promise<boolean>;
}) {
  async function submit(f: FormData) {
    await call("/api/admin/profile", "PATCH", Object.fromEntries(f.entries()));
  }
  return (
    <div>
      <div className="admin-title">
        <span className="kicker">Dados pessoais</span>
        <h2>Minha conta</h2>
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
          <input name="newPassword" type="password" minLength={10} />
        </label>
        <button className="button primary">Atualizar minha conta</button>
      </form>
    </div>
  );
}
