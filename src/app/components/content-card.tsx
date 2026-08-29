/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { ArrowUpRight, CalendarDays, MapPin } from "./icons";
import type { ContentItem } from "../lib/types";

export function ContentCard({ item, href }: { item: ContentItem; href?: string }) {
  const destination = href ?? `/conteudos/${encodeURIComponent(item.slug)}`;
  const external = /^https?:\/\//i.test(destination);
  const linkContent = <>Saiba mais <ArrowUpRight size={17} /></>;
  return <article className="content-card">
    <div className="card-image">{item.imageUrl ? <img src={item.imageUrl} alt={item.title} loading="lazy" decoding="async" /> : <div className="circuit-art"><span>{item.category ?? item.module.replaceAll("_", " ")}</span></div>}</div>
    <div className="card-body"><div className="eyebrow">{item.category ?? item.module.replaceAll("_", " ")}</div><h3>{item.title}</h3><p>{item.summary}</p>
      {(item.startAt || item.location) && <div className="meta">{item.startAt && <span><CalendarDays size={15}/>{new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(new Date(item.startAt))}</span>}{item.location && <span><MapPin size={15}/>{item.location}</span>}</div>}
      {external ? <a href={destination} target="_blank" rel="noopener noreferrer" className="card-link">{linkContent}</a> : <Link href={destination} className="card-link">{linkContent}</Link>}
    </div>
  </article>;
}
