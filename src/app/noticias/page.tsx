import type { Metadata } from "next";
import { ListingPage } from "../components/listing-page";
import { getPublicData, requirePublicSection } from "../lib/public-data";
export const metadata: Metadata = { title: "Notícias" };
export default async function Page() {
  const data = await getPublicData();
  requirePublicSection(data,"news");
  return (
    <ListingPage
      kicker="Atualizações"
      title="Notícias"
      description="Decisões, projetos, conquistas e histórias da comunidade de Engenharia de Computação."
      items={data.content.filter((i) => i.module === "news")}
    />
  );
}
