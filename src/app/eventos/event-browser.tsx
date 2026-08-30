"use client";

import Link from "next/link";
import { useState } from "react";

export type BrowserEvent = { id: string; slug: string; title: string; summary: string; location?: string; startAt?: string; endAt?: string; metadata?: string };
function statusOf(item: BrowserEvent) { const past=Boolean(item.endAt&&new Date(item.endAt)<new Date())||Boolean(!item.endAt&&item.startAt&&new Date(item.startAt)<new Date());if(past)return "Evento realizado";try{const status=JSON.parse(item.metadata||"{}").registrationStatus;return status==="sold_out"?"Esgotado":status==="closed"?"Inscrições encerradas":"Inscrições abertas"}catch{return "Confira as inscrições"} }
export function EventBrowser({items}:{items:BrowserEvent[]}) {
  const [query,setQuery]=useState("");const [month,setMonth]=useState("todos");const [year,setYear]=useState("todos");
  const years=Array.from(new Set(items.map(item=>item.startAt?new Date(item.startAt).getFullYear().toString():"").filter(Boolean))).sort();
  const visible=items.filter(item=>{const date=item.startAt?new Date(item.startAt):null;const text=`${item.title} ${item.summary} ${item.location||""}`.toLocaleLowerCase("pt-BR");return text.includes(query.toLocaleLowerCase("pt-BR"))&&(month==="todos"||date?.getMonth().toString()===month)&&(year==="todos"||date?.getFullYear().toString()===year)});
  return <><div className="event-filters"><label>Pesquisar<input type="search" value={query} onChange={event=>setQuery(event.target.value)} placeholder="Nome do evento"/></label><label>Mês<select value={month} onChange={event=>setMonth(event.target.value)}><option value="todos">Todos</option>{["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"].map((name,index)=><option value={String(index)} key={name}>{name}</option>)}</select></label><label>Ano<select value={year} onChange={event=>setYear(event.target.value)}><option value="todos">Todos</option>{years.map(value=><option key={value}>{value}</option>)}</select></label></div><div className="event-list">{visible.map(item=><Link className="event-list-card" href={`/eventos/${item.slug}`} key={item.id}><span>{statusOf(item)}</span><div>{item.startAt&&<time dateTime={item.startAt}>{new Date(item.startAt).toLocaleDateString("pt-BR",{day:"2-digit",month:"short",year:"numeric",timeZone:"America/Sao_Paulo"})}</time>}<h2>{item.title}</h2><p>{item.summary}</p>{item.location&&<small>{item.location}</small>}</div><strong>Ver detalhes</strong></Link>)}</div>{!visible.length&&<div className="empty">Nenhum evento corresponde aos filtros.</div>}</>;
}
