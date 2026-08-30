import type { PublicData } from "./types";

export const sampleData: PublicData = {
  settings: {
    sections: {
      news: true, events: true, ca_products: true, stores: true, documents: true,
      gallery: true, company_opportunities: true, academic_opportunities: true,
      directors: true, departments:true, calendar:true, instagram: true, about: true, history: false, pretinha: false, photo_initiatives: true, journal: true,
    },
    heroTitle: "Engenharia que conecta. Comunidade que transforma.",
    heroText: "Informações, ações e serviços do Centro Acadêmico da Engenharia de Computação para quem vive o curso na UFG.",
    aboutTitle: "Entidade estudantil de Engenharia de Computação",
    aboutText: "O Centro Acadêmico da Engenharia de Computação Weber Martins representa quem estuda Engenharia de Computação na UFG. O CAECOMP organiza demandas, constrói diálogo com a universidade e cria espaços para a formação, a convivência e a vida estudantil.",
    historyText: "",
    instagramPosts: ["https://www.instagram.com/caecompufg/", "https://www.instagram.com/caecompufg/", "https://www.instagram.com/caecompufg/"],
  },
  content: [
    { id: "n1", module: "news", title: "Um novo hub para a comunidade CAECOMP", slug: "novo-hub", summary: "Notícias, oportunidades, documentos e tudo que importa para a nossa comunidade agora vivem em um só lugar.", category: "Institucional", status: "published", imageUrl: "/caecomp-logo-official.jpg" },
    { id: "n2", module: "news", title: "Acolhida aos ingressantes da EMC/UFG", slug: "acolhida", summary: "Integração, orientação acadêmica e primeiro contato com as entidades que movimentam a universidade.", category: "Comunidade", status: "published" },
    { id: "e1", module: "events", title: "Jornada Stack: tecnologia e inovação", slug: "jornada-stack", summary: "Palestras, projetos e demonstrações para aproximar estudantes, pesquisa e mercado.", status: "published", startAt: "2026-10-31T08:00:00-03:00", location: "EMC/UFG — Campus Colemar Natal e Silva", capacityMode: "limited", capacityQty: 120 },
    { id: "p1", module: "ca_products", title: "Camiseta oficial CAECOMP", slug: "camiseta-oficial", summary: "Identidade, tecnologia e orgulho de fazer parte da Engenharia de Computação.", status: "published", price: 59.9, stockMode: "limited", stockQty: 30, imageUrl: "/caecomp-logo-official.jpg" },
    { id: "v1", module: "stores", title: "Doces da Computação", slug: "doces", summary: "Brownies e brigadeiros feitos por estudantes. Consulte sabores e disponibilidade.", status: "published", ownerName: "Vendinha estudantil", whatsapp: "", stockMode: "unlimited" },
    { id: "o1", module: "company_opportunities", title: "Processos seletivos divulgados ao CAECOMP", slug: "processos-seletivos", summary: "Vagas e processos seletivos que chegam ao CAECOMP para divulgação pública.", status: "published", ctaLabel: "Ver processo", ctaUrl: "#contato" },
    { id: "a1", module: "academic_opportunities", title: "Iniciação científica e extensão", slug: "iniciacao-cientifica", summary: "Editais, laboratórios, bolsas, ligas acadêmicas e projetos para ir além da sala de aula.", status: "published", category: "Pesquisa e extensão" },
    { id: "d1", module: "documents", title: "Estatuto e documentos institucionais", slug: "estatuto", summary: "Transparência, memória e organização estudantil.", status: "published", category: "Institucional" },
  ],
  directors: [
    { id: "m1", name: "Diretoria CAECOMP", role: "Presidência", department: "Presidência" },
    { id: "m2", name: "Equipe CAECOMP", role: "Diretoria de Eventos", department: "Eventos" },
    { id: "m3", name: "Equipe CAECOMP", role: "Diretoria Acadêmica", department: "Acadêmico" },
  ],
  stores: [],
  photoCampaigns: [{ id: "pretinha", title: "Pretinha", slug: "pretinha", summary: "Os melhores registros da Pretinha, a cachorra adotada pela comunidade da EMC.", status: "open", selectionLimit: 30 }],
  calendarItems: [],
};
