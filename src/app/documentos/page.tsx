import type { Metadata } from "next";
import { ListingPage } from "../components/listing-page";
import { getPublicData, requirePublicSection } from "../lib/public-data";
export const metadata: Metadata = { title: "Documentos" };
export default async function Page() {
  const data = await getPublicData();
  requirePublicSection(data,"documents");
  return (
    <ListingPage
      kicker="Transparência"
      title="Documentos"
      description="Estatuto, atas, editais, prestações de contas, guias acadêmicos e documentos de interesse da comunidade."
      items={data.content.filter((i) => i.module === "documents")}
    />
  );
}
