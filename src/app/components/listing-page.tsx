import { ContentCard } from "./content-card";
import type { ContentItem } from "../lib/types";

export function ListingPage({ kicker, title, description, items }: { kicker: string; title: string; description: string; items: ContentItem[] }) {
  return <><section className="page-hero"><span className="kicker light">{kicker}</span><h1>{title}</h1><p>{description}</p></section><section className="page-content">{items.length ? <div className="card-grid">{items.map(item => <ContentCard key={item.id} item={item} href={item.documentUrl ?? item.ctaUrl ?? `/conteudos/${encodeURIComponent(item.slug)}`}/>)}</div> : <div className="empty">Nenhum conteúdo publicado ainda.</div>}</section></>;
}
