import type { Metadata } from "next";
import { getPublicData, requirePublicSection } from "../lib/public-data";
export const metadata: Metadata = { title: "Galeria" };
export default async function Page() {
  const data=await getPublicData();requirePublicSection(data,"gallery");const items = data.content.filter(
    (i) => i.module === "gallery" && i.imageUrl,
  );
  return (
    <>
      <section className="page-hero">
        <span className="kicker light">Memória</span>
        <h1>Galeria CAECOMP</h1>
        <p>
          Registros das ações, encontros e pessoas que fazem nossa história.
        </p>
      </section>
      <section className="page-content">
        {items.length ? (
          <div className="card-grid">
            {items.map((i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i.id}
                src={i.imageUrl!}
                alt={i.title}
                loading="lazy"
                decoding="async"
              />
            ))}
          </div>
        ) : (
          <div className="empty">
            A galeria está pronta para receber os primeiros registros.
          </div>
        )}
      </section>
    </>
  );
}
