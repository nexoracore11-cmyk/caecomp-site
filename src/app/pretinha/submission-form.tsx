"use client";

import { useState } from "react";

export function PretinhaSubmissionForm({campaignId,campaignTitle}:{campaignId:string;campaignTitle:string}) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  async function submit(formData: FormData) {
    setSending(true);
    setMessage("");
    const response = await fetch("/api/pretinha", { method: "POST", body: formData });
    const result = await response.json().catch(() => ({}));
    setSending(false);
    if (response.ok) {
      setMessage("Foto enviada. Agora ela aguarda a seleção da equipe CAECOMP.");
      const form = document.getElementById("pretinha-form") as HTMLFormElement | null;
      form?.reset();
    } else {
      setMessage(String(result.error ?? "Não foi possível enviar a foto."));
    }
  }

  return (
    <form id="pretinha-form" action={submit} className="pretinha-form">
      <div className="pretinha-field full">
        <label htmlFor="pretinha-photo">Foto para {campaignTitle} *</label>
        <input id="pretinha-photo" name="photo" type="file" accept="image/jpeg,image/png,image/webp" required />
        <small>JPG, PNG ou WebP, com até 10 MB.</small>
      </div>
      <input type="hidden" name="campaignId" value={campaignId}/>
      <div className="pretinha-field">
        <label htmlFor="pretinha-title">Título da foto <span>opcional</span></label>
        <input id="pretinha-title" name="title" maxLength={120} placeholder="Ex.: A guardiã da quadra" />
      </div>
      <div className="pretinha-field full">
        <label htmlFor="pretinha-description">Descrição <span>opcional</span></label>
        <textarea id="pretinha-description" name="description" maxLength={800} rows={4} placeholder="Conte a história desse momento..." />
      </div>
      <input className="pretinha-honeypot" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <label className="pretinha-consent full">
        <input type="checkbox" required />
        <span>Confirmo que posso enviar esta imagem e autorizo sua publicação gratuita nos canais do CAECOMP caso ela seja selecionada.</span>
      </label>
      <button className="button primary" disabled={sending}>{sending ? "Enviando..." : "Enviar foto para seleção"}</button>
      {message && <p className="pretinha-message" role="status">{message}</p>}
    </form>
  );
}
