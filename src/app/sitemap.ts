import type { MetadataRoute } from "next";
import { getPublicData } from "./lib/public-data";

const base = "https://caecomp.com.br";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const data = await getPublicData();
  const pages: Array<[string, string | null]> = [["", null], ["/noticias", "news"], ["/eventos", "events"], ["/calendario", "calendar"], ["/diretorias", "departments"], ["/documentos", "documents"], ["/galeria", "gallery"], ["/sobre", "about"], ["/produtos", "ca_products"], ["/vendinhas", "stores"], ["/olhares", "photo_initiatives"]];
  if (data.settings.sections.company_opportunities !== false || data.settings.sections.academic_opportunities !== false) pages.push(["/oportunidades", null]);
  const entries = pages.filter(([, section]) => !section || data.settings.sections[section] !== false).map(([path]) => ({ url: `${base}${path}`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: path === "" ? 1 : 0.7 }));
  const content = data.content.flatMap((item) => item.module === "news" ? [{ url: `${base}/conteudos/${item.slug}`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.6 }] : item.module === "events" ? [{ url: `${base}/eventos/${item.slug}`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.7 }] : []);
  const stores = data.stores.map((store) => ({ url: `${base}/vendinhas/${store.slug}`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.6 }));
  return [...entries, ...content, ...stores];
}
