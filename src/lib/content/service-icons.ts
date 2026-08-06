import {
  TrendingUp,
  Megaphone,
  Search,
  Palette,
  CodeXml,
  Share2,
  Video,
  PenTool,
  FileText,
  UserRound,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const SERVICE_ICONS: Record<string, LucideIcon> = {
  cro: TrendingUp,
  "conversion-rate-optimization": TrendingUp,
  "google-ads": Megaphone,
  "google-meta-ads": Megaphone,
  ppc: Megaphone,
  seo: Search,
  branding: Palette,
  "brand-strategy": Palette,
  "web-development": CodeXml,
  "website-design-development": CodeXml,
  smm: Share2,
  "social-media-marketing": Share2,
  "video-editing": Video,
  "graphic-design": PenTool,
  "content-marketing": FileText,
  "personal-branding": UserRound,
};

const DEFAULT_SERVICE_ICON: LucideIcon = Sparkles;

export function getServiceIcon(slug: string): LucideIcon {
  return SERVICE_ICONS[slug] ?? DEFAULT_SERVICE_ICON;
}
