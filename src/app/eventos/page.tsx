import type { Metadata } from "next";
import { ListingPage } from "../components/listing-page";
import { getPublicData, requirePublicSection } from "../lib/public-data";
export const metadata: Metadata = { title: "Eventos" };
export default async function Page() {
  const data = await getPublicData();
  requirePublicSection(data,"events");
  return (
    <ListingPage
      kicker="Agenda CAECOMP"
      title="Eventos que aproximam"
      description="Palestras, visitas, recepções, workshops, cultura e integração. Eventos podem ter vagas limitadas ou ilimitadas."
      items={data.content.filter((i) => i.module === "events")}
    />
  );
}
