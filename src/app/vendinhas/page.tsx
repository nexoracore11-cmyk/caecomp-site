/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import { RequestForm } from "../components/request-form";
import { getPublicData, requirePublicSection } from "../lib/public-data";
export const metadata: Metadata = { title: "Vendinhas" };
export default async function Page() {
  const data=await getPublicData();requirePublicSection(data,"stores");const items = data.content.filter((i) => i.module === "stores");
  return (
    <>
      <section className="page-hero">
        <span className="kicker light">De estudante para estudante</span>
        <h1>Vendinhas da comunidade</h1>
        <p>
          Um espaço de divulgação para iniciativas dos estudantes. O CAECOMP não
          processa pagamentos; cada responsável combina atendimento e entrega
          diretamente.
        </p>
      </section>
      <section className="page-content">
        <div className="product-grid">
          {items.map((item) => (
            <article key={item.id} className="product-card">
              {item.imageUrl && <img className="product-image" src={item.imageUrl} alt={item.title} loading="lazy" decoding="async" />}
              <span className="eyebrow">{item.ownerName}</span>
              <h3>{item.title}</h3>
              <p>{item.summary}</p>
              {item.price != null && <div className="price">{item.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</div>}
              <div className="stock">
                Consulte disponibilidade com a vendinha
              </div>
              <RequestForm
                itemId={item.id}
                kind="store"
                label="Tenho interesse"
              />
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
