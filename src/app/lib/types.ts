export const modules = [
  "news", "events", "ca_products", "stores", "documents", "gallery",
  "company_opportunities", "academic_opportunities", "directors", "instagram",
] as const;

export type ModuleKey = (typeof modules)[number];

export type ContentItem = {
  id: string;
  module: ModuleKey;
  title: string;
  slug: string;
  summary: string;
  content?: string;
  imageUrl?: string;
  documentUrl?: string;
  category?: string;
  status: "draft" | "pending" | "published" | "rejected" | "archived";
  startAt?: string;
  endAt?: string;
  location?: string;
  price?: number;
  stockMode?: "limited" | "unlimited";
  stockQty?: number;
  capacityMode?: "limited" | "unlimited";
  capacityQty?: number;
  ctaLabel?: string;
  ctaUrl?: string;
  ownerName?: string;
  whatsapp?: string;
  ownerUserId?: string;
  reviewedBy?: string;
  reviewedAt?: string;
};

export type Director = {
  id: string;
  name: string;
  role: string;
  department: string;
  photoUrl?: string;
  whatsapp?: string;
  linkedin?: string;
  lattes?: string;
  instagram?: string;
};

export type SiteSettings = {
  sections: Record<string, boolean>;
  heroTitle: string;
  heroText: string;
  aboutTitle: string;
  aboutText: string;
  historyText: string;
  instagramPosts: string[];
};

export type PublicData = {
  settings: SiteSettings;
  content: ContentItem[];
  directors: Director[];
};

export const accessLevels = ["member", "master", "presidency", "supreme"] as const;
export type AccessLevel = (typeof accessLevels)[number];

export type PretinhaPhoto = {
  id: string;
  fileId: string;
  title?: string;
  description?: string;
  status: "pending" | "approved" | "rejected";
  selectedRank?: number;
  submittedAt?: string;
};
