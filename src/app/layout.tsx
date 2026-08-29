import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./instagram.css";
import { SiteHeader } from "./components/site-header";
import { SiteFooter } from "./components/site-footer";
import { getPublicData } from "./lib/public-data";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://caecomp.com.br"),
  title: { default: "CAECOMP UFG", template: "%s · CAECOMP UFG" },
  description: "Portal do Centro Acadêmico da Engenharia de Computação da UFG.",
  applicationName:"CAECOMP UFG",
  openGraph: { title: "CAECOMP UFG", description: "Engenharia que conecta. Comunidade que transforma.", images: ["/caecomp-logo-official.jpg"], locale: "pt_BR", type: "website" },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { settings } = await getPublicData();
  return (
    <html
      lang="pt-BR"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col"><script dangerouslySetInnerHTML={{__html:`(()=>{try{const t=localStorage.getItem('caecomp-theme');document.documentElement.dataset.theme=t||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light')}catch{}})()`}}/><SiteHeader sections={settings.sections}/><main>{children}</main><SiteFooter/></body>
    </html>
  );
}
