/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicData } from "@/app/lib/public-data";
import { RequestForm } from "@/app/components/request-form";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = await getPublicData();
  const item = data.content.find((content) => content.slug === slug);
  return item && data.settings.sections[item.module] !== false ? { title: item.title, description: item.summary } : { title: "Conteúdo não encontrado" };
}

export default async function ContentDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data=await getPublicData();const item = data.content.find((content) => content.slug === slug);
  if (!item) notFound();
  if(data.settings.sections[item.module]===false)notFound();
  const requestKind = item.module === "company_opportunities" || item.module === "academic_opportunities" ? "opportunity" : null;
  return <>
    <section className="page-hero"><span className="kicker light">{item.category ?? "CAECOMP"}</span><h1>{item.title}</h1><p>{item.summary}</p></section>
    <article className="page-content content-detail">
      {item.imageUrl && <img src={item.imageUrl} alt={item.title} />}
      {(item.startAt || item.location) && <div className="detail-meta">{item.startAt && <span><strong>Data:</strong> {new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeStyle: "short" }).format(new Date(item.startAt))}</span>}{item.location && <span><strong>Local:</strong> {item.location}</span>}</div>}
      {item.content ? <div className="detail-copy">{item.content}</div> : <div className="detail-copy">{item.summary}</div>}
      <div className="detail-actions">
        {item.documentUrl && <a className="button primary" href={item.documentUrl} target="_blank" rel="noopener noreferrer">Abrir documento</a>}
        {item.ctaUrl && <a className="button primary" href={item.ctaUrl} target="_blank" rel="noopener noreferrer">{item.ctaLabel || "Acessar"}</a>}
        {requestKind && <RequestForm itemId={item.id} kind={requestKind} label="Tenho interesse" />}
      </div>
    </article>
  </>;
}
