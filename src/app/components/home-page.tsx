import Image from "next/image";
import Link from "next/link";
import { ContentCard } from "./content-card";
import { SectionHeading } from "./section-heading";
import {
  ArrowUpRight,
  FileText,
  GraduationCap,
  Instagram,
  Package,
  ShoppingBag,
  Users,
} from "./icons";
import type { PublicData } from "../lib/types";

const by = (data: PublicData, module: string) =>
  data.content.filter(
    (item) => item.module === module && item.status === "published",
  );
const instagramEmbedUrl = (url: string) =>
  /instagram\.com\/(p|reel)\//.test(url)
    ? `${url.split("?")[0].replace(/\/$/, "")}/embed/`
    : null;

export function HomePage({ data }: { data: PublicData }) {
  const { settings } = data;
  const opportunitiesEnabled = settings.sections.company_opportunities || settings.sections.academic_opportunities;
  const primaryHref = opportunitiesEnabled ? "/oportunidades" : settings.sections.news ? "/noticias" : "/sobre";
  return (
    <>
      <section className="hero">
        <div className="hero-glow" />
        <div className="hero-grid">
          <div className="hero-copy">
            <span className="kicker light">
              Centro Acadêmico · Engenharia de Computação · UFG
            </span>
            <h1>{settings.heroTitle}</h1>
            <p>{settings.heroText}</p>
            <div className="hero-actions">
              <Link className="button primary" href={primaryHref}>
                {opportunitiesEnabled ? "Explorar oportunidades" : "Explorar o portal"} <ArrowUpRight size={18} />
              </Link>
              <Link className="button ghost" href="/sobre">
                Conheça o CAECOMP
              </Link>
            </div>
            <div className="hero-proof">
              <span>
                <strong>Desde 2017</strong>representando estudantes
              </span>
              <span>
                <strong>7 diretorias</strong>trabalho colaborativo
              </span>
              <span>
                <strong>100% digital</strong>informação acessível
              </span>
            </div>
          </div>
          <div className="hero-visual">
            <div className="orbit one" />
            <div className="orbit two" />
            <div className="logo-stage">
              <Image
                src="/caecomp-logo.jpg"
                width={340}
                height={340}
                alt="Marca do CAECOMP"
                priority
              />
            </div>
            <div className="floating-card fc-one">
              <span>01</span>
              <p>
                Projetos
                <br />
                <strong>que conectam</strong>
              </p>
            </div>
            <div className="floating-card fc-two">
              <span>02</span>
              <p>
                Ideias
                <br />
                <strong>que transformam</strong>
              </p>
            </div>
          </div>
        </div>
      </section>
      <section className="quick-links">
        {settings.sections.ca_products && <Link href="/produtos">
          <Package />
          <span>
            <strong>Produtos CA</strong>Solicite pelo site
          </span>
          <ArrowUpRight />
        </Link>}
        {settings.sections.stores && <Link href="/vendinhas">
          <ShoppingBag />
          <span>
            <strong>Vendinhas</strong>Apoie estudantes
          </span>
          <ArrowUpRight />
        </Link>}
        {opportunitiesEnabled && <Link href="/oportunidades">
          <GraduationCap />
          <span>
            <strong>Oportunidades</strong>Carreira e academia
          </span>
          <ArrowUpRight />
        </Link>}
        {settings.sections.documents && <Link href="/documentos">
          <FileText />
          <span>
            <strong>Documentos</strong>Transparência
          </span>
          <ArrowUpRight />
        </Link>}
      </section>
      {settings.sections.news && (
        <section className="section">
          <SectionHeading
            kicker="Em movimento"
            title="Notícias do CAECOMP"
            text="Acompanhe decisões, projetos e histórias da nossa comunidade."
            href="/noticias"
          />
          <div className="card-grid">
            {by(data, "news")
              .slice(0, 3)
              .map((item) => (
                <ContentCard key={item.id} item={item} />
              ))}
          </div>
        </section>
      )}
      {settings.sections.events && (
        <section className="section dark-section">
          <SectionHeading
            kicker="Agenda"
            title="Próximos encontros"
            text="Conhecimento, integração e experiências que vão além da sala de aula."
            href="/eventos"
          />
          <div className="card-grid">
            {by(data, "events")
              .slice(0, 3)
              .map((item) => (
                <ContentCard key={item.id} item={item} />
              ))}
          </div>
        </section>
      )}
      {opportunitiesEnabled && <section className="section opportunity-band">
        <div>
          <span className="kicker">Seu próximo passo</span>
          <h2>Oportunidades para crescer dentro e fora da UFG</h2>
          <p>
            Estágios, processos seletivos, iniciação científica, extensão, ligas
            acadêmicas e ramos estudantis.
          </p>
        </div>
        <div className="opportunity-links">
          <Link href="/oportunidades?tipo=empresas">
            <span>Mercado & empresas</span>
            <ArrowUpRight />
          </Link>
          <Link href="/oportunidades?tipo=academico">
            <span>Pesquisa & extensão</span>
            <ArrowUpRight />
          </Link>
        </div>
      </section>}
      {settings.sections.about && (
        <section className="section about-grid">
          <div className="about-art">
            <Image
              src="/caecomp-logo.jpg"
              fill
              sizes="(max-width: 800px) 100vw, 45vw"
              alt="Marca CAECOMP"
            />
          </div>
          <div>
            <span className="kicker">Sobre nós</span>
            <h2>{settings.aboutTitle}</h2>
            <p>{settings.aboutText}</p>
            <ul>
              <li>
                <Users />
                Representação estudantil e diálogo institucional
              </li>
              <li>
                <GraduationCap />
                Apoio acadêmico, científico e profissional
              </li>
              <li>
                <Package />
                Projetos, produtos e iniciativas da comunidade
              </li>
            </ul>
            <Link className="text-link" href="/sobre">
              Nossa história <ArrowUpRight />
            </Link>
          </div>
        </section>
      )}
      {settings.sections.instagram && (
        <section className="section instagram-section">
          <SectionHeading
            kicker="@caecompufg"
            title="Conectados no Instagram"
            text="Três publicações escolhidas pela diretoria de Marketing."
            href="https://www.instagram.com/caecompufg/"
            link="Abrir Instagram"
          />
          <div className="instagram-grid">
            {settings.instagramPosts.slice(0, 3).map((url, index) => {
              const embed = instagramEmbedUrl(url);
              return <article key={index} className="instagram-card">
                <div className="ig-top">
                  <Image
                    src="/caecomp-logo.jpg"
                    width={36}
                    height={36}
                    alt=""
                  />
                  <strong>caecompufg</strong>
                  <span>•••</span>
                </div>
                <div className={`ig-art ${embed ? "embed" : ""}`}>
                  {embed ? <iframe src={embed} title={`Publicação ${index + 1} do CAECOMP no Instagram`} loading="lazy" allow="encrypted-media" /> : <Image src="/caecomp-logo.jpg" fill sizes="33vw" alt="Selecione uma publicação no painel" />}
                </div>
                <a href={url} target="_blank" rel="noreferrer" className="ig-bottom">
                  <Instagram />
                  <span>Ver publicação no Instagram</span>
                  <ArrowUpRight />
                </a>
              </article>;
            })}
          </div>
        </section>
      )}
    </>
  );
}
