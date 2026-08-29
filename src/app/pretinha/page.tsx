import type { Metadata } from "next";
import Image from "next/image";
import { getApprovedPretinhaPhotos } from "../lib/pretinha";
import { getPublicData, requirePublicSection } from "../lib/public-data";
import { PretinhaSubmissionForm } from "./submission-form";

export const metadata: Metadata = {
  title: "Pretinha",
  description: "Envie seu melhor registro da Pretinha e participe da galeria especial do CAECOMP.",
};

export default async function PretinhaPage() {
  const data=await getPublicData();requirePublicSection(data,"pretinha");
  const photos = await getApprovedPretinhaPhotos();
  return (
    <>
      <section className="pretinha-hero">
        <div className="pretinha-hero-copy">
          <span className="kicker light">A mascote da nossa quadra</span>
          <h1>Os melhores momentos da Pretinha, pelos olhos de quem convive com ela.</h1>
          <p>A comunidade envia, a equipe CAECOMP seleciona e as 30 melhores fotos ganham um lugar especial no novo site.</p>
          <a href="#enviar" className="button primary">Quero enviar uma foto</a>
        </div>
        <div className="pretinha-number" aria-label="Trinta fotos selecionadas"><strong>30</strong><span>fotos<br/>selecionadas</span></div>
      </section>

      <section className="pretinha-gallery" aria-labelledby="pretinha-gallery-title">
        <div className="pretinha-section-head">
          <div><span className="kicker">Galeria da Pretinha</span><h2 id="pretinha-gallery-title">As escolhidas</h2></div>
          <p>{photos.length} de 30 fotos selecionadas</p>
        </div>
        {photos.length ? (
          <div className="pretinha-grid">
            {photos.map((photo, index) => (
              <article className="pretinha-photo" key={photo.id}>
                <div className="pretinha-photo-image">
                  <Image src={`/api/pretinha/${photo.id}/image`} fill sizes="(max-width: 760px) 100vw, (max-width: 1100px) 50vw, 33vw" alt={photo.title || `Foto selecionada da Pretinha ${index + 1}`} />
                  <span>#{photo.selectedRank ?? index + 1}</span>
                </div>
                {(photo.title || photo.description) && <div className="pretinha-photo-copy">{photo.title && <h3>{photo.title}</h3>}{photo.description && <p>{photo.description}</p>}</div>}
              </article>
            ))}
          </div>
        ) : (
          <div className="pretinha-empty"><strong>A galeria está esperando a primeira escolhida.</strong><span>O próximo registro especial pode ser o seu.</span></div>
        )}
      </section>

      <section className="pretinha-submit" id="enviar">
        <div className="pretinha-submit-copy"><span className="kicker light">Participe</span><h2>Você encontrou a Pretinha em um momento inesquecível?</h2><p>Envie a foto original. Título e descrição são opcionais e só aparecem publicamente se o registro for selecionado.</p><ul><li>Somente fotos da Pretinha</li><li>Até 10 MB por envio</li><li>Publicação após aprovação dos masters</li></ul></div>
        <PretinhaSubmissionForm />
      </section>
    </>
  );
}
