export type PublicSections = Record<string, boolean>;

const moduleSections: Record<string, string> = {
  news: "news",
  events: "events",
  ca_products: "ca_products",
  stores: "stores",
  documents: "documents",
  gallery: "gallery",
  company_opportunities: "company_opportunities",
  academic_opportunities: "academic_opportunities",
  department_posts: "departments",
};

const permissionSections: Record<string, string | string[]> = {
  news: "news", events: "events", products: "ca_products", documents: "documents", gallery: "gallery",
  stores: "stores", stores_manage: "stores", stores_users: "stores", stores_approve: "stores",
  opportunities: ["company_opportunities", "academic_opportunities"], academic: "academic_opportunities",
  pretinha_moderate: "photo_initiatives", marketing: "instagram",
};

export function sectionEnabled(sections: PublicSections | undefined, key: string) {
  return sections?.[key] !== false;
}

export function moduleEnabled(sections: PublicSections | undefined, module: string) {
  const key = moduleSections[module];
  return !key || sectionEnabled(sections, key);
}

export function permissionEnabled(sections: PublicSections | undefined, permission: string) {
  const keys = permissionSections[permission];
  if (!keys) return true;
  return (Array.isArray(keys) ? keys : [keys]).some((key) => sectionEnabled(sections, key));
}
