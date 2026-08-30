import type { MetadataRoute } from "next";
import { getPublicData } from "./lib/public-data";

const base = "https://caecomp.com.br";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const data = await getPublicData();
  const staticPaths = ["", "/noticias", "/eventos", "/oportunidades", "/calendario", "/diretorias", "/documentos", "/galeria", "/sobre", "/produtos", "/vendinhas", "/olhares"];
  const entries = staticPaths.map((path) => ({ url: `${base}${path}`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: path === "" ? 1 : 0.7 }));
  const content = data.content.filter((item) => ["news", "events", "documents", "company_opportunities", "academic_opportunities"].includes(item.module)).map((item) => ({ url: `${base}/conteudos/${item.slug}`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.6 }));
  const stores = data.stores.map((store) => ({ url: `${base}/vendinhas/${store.slug}`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.6 }));
  return [...entries, ...content, ...stores];
}
