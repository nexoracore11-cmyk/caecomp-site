import type { Metadata } from "next";
import { ListingPage } from "../components/listing-page";
import { getPublicData } from "../lib/public-data";
import { notFound } from "next/navigation";
export const metadata: Metadata = { title: "Oportunidades" };
export default async function Page() {
  const data=await getPublicData();if(data.settings.sections.company_opportunities===false&&data.settings.sections.academic_opportunities===false)notFound();const items = data.content.filter(
    (i) =>
      i.module === "company_opportunities" ||
      i.module === "academic_opportunities",
  );
  return (
    <ListingPage
      kicker="Carreira e formação"
      title="Oportunidades"
      description="Processos seletivos de empresas parceiras e caminhos institucionais: iniciação científica, extensão, monitoria, ligas, equipes e ramos estudantis."
      items={items}
    />
  );
}
