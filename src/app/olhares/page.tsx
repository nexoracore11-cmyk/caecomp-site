import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getPublicData, requirePublicSection } from "../lib/public-data";
export const metadata:Metadata={title:"Olhares CAECOMP",description:"Iniciativas fotográficas e galerias da comunidade CAECOMP."};
export default async function Page(){const data=await getPublicData();requirePublicSection(data,"photo_initiatives");return <><section className="page-hero"><span className="kicker light">Memória coletiva</span><h1>Olhares CAECOMP</h1><p>Campanhas fotográficas que registram pessoas, espaços e histórias da nossa comunidade. Cada edição permanece disponível depois do encerramento.</p></section><section className="page-content"><div className="campaign-grid">{data.photoCampaigns.map(c=><Link href={`/olhares/${c.slug}`} className="campaign-card" key={c.id}>{c.coverUrl&&<div className="campaign-cover"><Image src={c.coverUrl} fill sizes="(max-width:760px) 100vw, 50vw" alt=""/></div>}<span>{c.status==="open"?"Envios abertos":"Galeria final"}</span><h2>{c.title}</h2><p>{c.summary}</p><strong>Ver edição</strong></Link>)}</div></section></>}
