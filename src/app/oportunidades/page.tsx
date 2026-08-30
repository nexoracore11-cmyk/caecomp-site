import type { Metadata } from "next";
import { getPublicData } from "../lib/public-data";
import { notFound } from "next/navigation";
export const metadata: Metadata = { title: "Oportunidades" };
export default async function Page() {
  const data=await getPublicData();
  if(data.settings.sections.company_opportunities===false&&data.settings.sections.academic_opportunities===false)notFound();
  const selections=data.content.filter((item)=>item.module==="company_opportunities");
  const academic=data.content.filter((item)=>item.module==="academic_opportunities");
  const list=(title:string,description:string,items:typeof selections)=><section className="opportunity-group"><h2>{title}</h2><p>{description}</p>{items.length?<div className="card-grid">{items.map(item=><article className="content-card" key={item.id}><div className="card-body"><span className="eyebrow">{item.category||"Divulgação"}</span><h3>{item.title}</h3><p>{item.summary}</p>{item.ctaUrl&&<a className="card-link" href={item.ctaUrl} target="_blank" rel="noopener noreferrer">Ver informações</a>}</div></article>)}</div>:<div className="empty">Nenhuma divulgação disponível no momento.</div>}</section>;
  return <><section className="page-hero"><span className="kicker light">Informações e inscrições</span><h1>Oportunidades</h1><p>Separadas para facilitar: divulgações externas enviadas ao CAECOMP e oportunidades acadêmicas da UFG e da comunidade.</p></section><section className="page-content">{list("Processos seletivos e vagas", "Vagas e processos seletivos recebidos pelo CAECOMP para divulgação pública.",selections)}{list("Oportunidades acadêmicas", "Iniciação científica, extensão, monitoria, ligas, equipes, ramos estudantis e outras inscrições acadêmicas.",academic)}</section></>;
}
