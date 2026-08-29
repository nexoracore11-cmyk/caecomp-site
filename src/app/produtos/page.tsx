/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import { RequestForm } from "../components/request-form";
import { getPublicData, requirePublicSection } from "../lib/public-data";
export const metadata: Metadata = { title: "Produtos do CA" };
export default async function Page() {
  const data=await getPublicData();requirePublicSection(data,"ca_products");const items = data.content.filter((i) => i.module === "ca_products");
  return (
    <>
      <section className="page-hero">
        <span className="kicker light">Feito pelo CAECOMP</span>
        <h1>Produtos oficiais</h1>
        <p>
          Escolha o que deseja e envie uma solicitação. Não há pagamento
          on-line: a Diretoria de Produtos confirma estoque, entra em contato e
          combina os próximos passos.
        </p>
      </section>
      <section className="page-content">
        <div className="product-grid">
          {items.map((item) => (
            <article key={item.id} className="product-card">
              {item.imageUrl && <img className="product-image" src={item.imageUrl} alt={item.title} loading="lazy" decoding="async" />}
              <span className="eyebrow">Produto oficial</span>
              <h3>{item.title}</h3>
              <p>{item.summary}</p>
              <div className="price">
                {item.price?.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </div>
              <div className="stock">
                {item.stockMode === "unlimited"
                  ? "Estoque ilimitado"
                  : `${item.stockQty ?? 0} unidades disponíveis`}
              </div>
              <RequestForm
                itemId={item.id}
                kind="product"
                label="Solicitar produto"
              />
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
