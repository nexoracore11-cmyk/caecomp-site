export const permissionOptions = [
  ["users_manage","Criar e gerenciar usuários"], ["site_manage","Gestão geral do site"],
  ["presidency","Presidência"], ["secretary","Secretaria"], ["treasury","Tesouraria"],
  ["academic","Diretoria Acadêmica"], ["events","Diretoria de Eventos"], ["marketing","Diretoria de Marketing"],
  ["products","Diretoria de Produtos"], ["stores","Gerenciar a própria vendinha"], ["stores_approve","Aprovar produtos de vendinhas"], ["news","Notícias"], ["documents","Documentos"],
  ["gallery","Galeria"], ["opportunities","Processos seletivos e oportunidades"], ["requests","Solicitações recebidas"],
  ["pretinha_moderate","Moderar iniciativas fotográficas"],
] as const;
export type Permission = (typeof permissionOptions)[number][0];
