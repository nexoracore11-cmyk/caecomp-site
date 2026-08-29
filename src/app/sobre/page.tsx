import type { Metadata } from "next";
import { getPublicData, requirePublicSection } from "../lib/public-data";
/* eslint-disable @next/next/no-img-element */
export const metadata: Metadata = { title: "Sobre nós" };
const whatsappUrl=(value:string)=>{const digits=value.replace(/\D/g,"");return `https://wa.me/${digits.startsWith("55")?digits:`55${digits}`}`};
export default async function Page() {
  const sampleData = await getPublicData();
  requirePublicSection(sampleData,"about");
  return (
    <>
      <section className="page-hero">
        <span className="kicker light">Quem somos</span>
        <h1>Representação com propósito</h1>
        <p>{sampleData.settings.aboutText}</p>
      </section>
      <section className="page-content about-copy">
        {sampleData.settings.sections.history && <section className="about-block"><span className="kicker">Nossa história</span>
        <h2>{sampleData.settings.aboutTitle}</h2>
        <p>{sampleData.settings.historyText}</p></section>}
        {sampleData.settings.sections.directors && <section className="about-block"><h2>Diretorias</h2>
        <div className="product-grid">
          {[
            "Presidência",
            "Secretaria",
            "Tesouraria",
            "Acadêmico",
            "Eventos",
            "Marketing",
            "Produtos",
          ].map((name) => (
            <article className="product-card" key={name}>
              <span className="eyebrow">Diretoria</span>
              <h3>{name}</h3>
              <p>
                Cada diretoria possui área própria no portal e pode ser ativada
                ou desativada pelos usuários autorizados.
              </p>
            </article>
          ))}
        </div>
        {sampleData.directors.length > 0 && (
          <>
            <h2>Membros atuais</h2>
            <div className="product-grid">
              {sampleData.directors.map((member) => (
                <article className="product-card" key={member.id}>
                  {member.photoUrl && <img className="director-photo" src={member.photoUrl} alt={`Foto de ${member.name}`} loading="lazy" decoding="async" />}
                  <span className="eyebrow">{member.department}</span>
                  <h3>{member.name}</h3>
                  <p>{member.role}</p>
                  <div className="director-links">
                    {member.whatsapp && <a href={whatsappUrl(member.whatsapp)} target="_blank" rel="noopener noreferrer">WhatsApp</a>}
                    {member.linkedin && <a href={member.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a>}
                    {member.lattes && <a href={member.lattes} target="_blank" rel="noopener noreferrer">Lattes</a>}
                    {member.instagram && <a href={member.instagram} target="_blank" rel="noopener noreferrer">Instagram</a>}
                  </div>
                </article>
              ))}
            </div>
          </>
        )}</section>}
        <h2>Dados institucionais</h2>
        <p>
          <strong>Razão social:</strong> Centro Acadêmico da Engenharia de
          Computação Weber Martins
          <br />
          <strong>Nome fantasia:</strong> CAWEM
          <br />
          <strong>CNPJ:</strong> 29.126.391/0001-77
          <br />
          <strong>Natureza jurídica:</strong> Associação privada
          <br />
          <strong>Sede:</strong> Praça Universitária, s/n, Setor Leste
          Universitário, Goiânia — GO, CEP 74605-220.
        </p>
      </section>
    </>
  );
}
