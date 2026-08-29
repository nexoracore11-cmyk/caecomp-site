"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Instagram, Menu, X } from "./icons";

const nav = [["Notícias", "/noticias", "news"], ["Eventos", "/eventos", "events"], ["Pretinha 🐾", "/pretinha", "pretinha"], ["Produtos", "/produtos", "ca_products"], ["Vendinhas", "/vendinhas", "stores"], ["Oportunidades", "/oportunidades", "opportunities"], ["Documentos", "/documentos", "documents"], ["Sobre", "/sobre", "about"]] as const;
export function SiteHeader({sections}:{sections:Record<string,boolean>}) {
  const [open, setOpen] = useState(false);
  const visibleNav=nav.filter(([, , key])=>key === "opportunities" ? sections.company_opportunities !== false || sections.academic_opportunities !== false : sections[key] !== false);
  return <header className="site-header"><div className="nav-shell"><Link href="/" className="brand" aria-label="CAECOMP — início"><Image src="/caecomp-logo.jpg" width={52} height={52} alt="Símbolo do CAECOMP" priority/><span><strong>CAECOMP</strong><small>Engenharia de Computação · UFG</small></span></Link><nav className="desktop-nav" aria-label="Navegação principal">{visibleNav.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}</nav><div className="nav-actions"><a href="https://www.instagram.com/caecompufg/" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><Instagram size={19}/></a><Link href="/admin" className="admin-link">Painel</Link><button className="menu-button" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="mobile-navigation" aria-label={open?"Fechar menu":"Abrir menu"}>{open ? <X/> : <Menu/>}</button></div></div>{open && <nav id="mobile-navigation" className="mobile-nav" aria-label="Navegação móvel">{visibleNav.map(([label, href]) => <Link key={href} href={href} onClick={() => setOpen(false)}>{label}</Link>)}</nav>}</header>;
}
