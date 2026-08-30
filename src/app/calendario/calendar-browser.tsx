"use client";

import { useMemo, useState } from "react";

export type CalendarEntry = { id: string; title: string; summary?: string; startsAt: string; endsAt?: string; kind: "ufg" | "caecomp"; department?: string; sourceUrl?: string };
const weekdays = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);
const dateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
const dateText = (value: string) => new Intl.DateTimeFormat("pt-BR", { day:"2-digit", month:"long", year:"numeric", hour:"2-digit", minute:"2-digit", timeZone:"America/Sao_Paulo" }).format(new Date(value));

export function CalendarBrowser({items}:{items:CalendarEntry[]}) {
  const [cursor,setCursor]=useState(startOfMonth(new Date()));
  const [scope,setScope]=useState<"all"|"ufg"|"caecomp">("all");
  const [selected,setSelected]=useState<CalendarEntry|null>(null);
  const visible=useMemo(()=>items.filter(item=>scope==="all"||item.kind===scope),[items,scope]);
  const eventsByDay=useMemo(()=>visible.reduce<Record<string,CalendarEntry[]>>((result,item)=>{const key=dateKey(new Date(item.startsAt));(result[key]??=[]).push(item);return result},{}),[visible]);
  const daysInMonth=new Date(cursor.getFullYear(),cursor.getMonth()+1,0).getDate();
  const leading=(new Date(cursor.getFullYear(),cursor.getMonth(),1).getDay()+6)%7;
  const cells=Array.from({length:leading+daysInMonth},(_,index)=>index<leading?null:new Date(cursor.getFullYear(),cursor.getMonth(),index-leading+1));
  const monthName=new Intl.DateTimeFormat("pt-BR",{month:"long",year:"numeric"}).format(cursor);
  return <div className="calendar-browser"><div className="calendar-controls"><div><button type="button" onClick={()=>setCursor(startOfMonth(new Date(cursor.getFullYear(),cursor.getMonth()-1)))} aria-label="Mês anterior">←</button><strong>{monthName}</strong><button type="button" onClick={()=>setCursor(startOfMonth(new Date(cursor.getFullYear(),cursor.getMonth()+1)))} aria-label="Próximo mês">→</button></div><div className="calendar-filter"><button className={scope==="all"?"active":""} onClick={()=>setScope("all")}>Todos</button><button className={scope==="ufg"?"active":""} onClick={()=>setScope("ufg")}>UFG</button><button className={scope==="caecomp"?"active":""} onClick={()=>setScope("caecomp")}>CAECOMP</button></div></div><div className="calendar-month" role="grid" aria-label={`Calendário de ${monthName}`}>{weekdays.map(day=><span className="calendar-weekday" key={day}>{day}</span>)}{cells.map((day,index)=>day?<button type="button" role="gridcell" className="calendar-day" key={dateKey(day)} onClick={()=>eventsByDay[dateKey(day)]?.[0]&&setSelected(eventsByDay[dateKey(day)][0])}><b>{day.getDate()}</b>{eventsByDay[dateKey(day)]?.slice(0,2).map(event=><span className={`calendar-chip ${event.kind}`} key={event.id}>{event.title}</span>)}{(eventsByDay[dateKey(day)]?.length??0)>2&&<small>+{eventsByDay[dateKey(day)].length-2}</small>}</button>:<span className="calendar-day blank" key={`blank-${index}`}/>)}</div>{selected&&<article className="calendar-event-card"><button className="calendar-close" onClick={()=>setSelected(null)} aria-label="Fechar detalhes">×</button><span className={`calendar-kind ${selected.kind}`}>{selected.kind==="ufg"?"UFG":selected.department||"CAECOMP"}</span><h2>{selected.title}</h2><time>{dateText(selected.startsAt)}{selected.endsAt?` — ${dateText(selected.endsAt)}`:""}</time>{selected.summary&&<p>{selected.summary}</p>}{selected.sourceUrl&&<a className="text-link" href={selected.sourceUrl} target="_blank" rel="noopener noreferrer">Abrir fonte</a>}</article>}<div className="calendar-list">{visible.map(item=><button type="button" className="calendar-entry" key={item.id} onClick={()=>setSelected(item)}><time>{dateText(item.startsAt)}</time><div><span className={`calendar-kind ${item.kind}`}>{item.kind==="ufg"?"UFG":item.department||"CAECOMP"}</span><h2>{item.title}</h2>{item.summary&&<p>{item.summary}</p>}</div></button>)}</div></div>
}
