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
  BrainCircuit,
  Workflow,
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
  // Slugs of the services currently published in WordPress (PARITY-1)
  "ai-consulting": BrainCircuit,
  "ai-automation": Workflow,
  "digital-marketing": Megaphone,
  "wordpress-development": CodeXml,
  "seo-optimization": Search,
  "ui-ux-design": Palette,
};

const DEFAULT_SERVICE_ICON: LucideIcon = Sparkles;

export function getServiceIcon(slug: string): LucideIcon {
  // Own-property check: a slug like "constructor" or "__proto__" must fall
  // back instead of returning an inherited Object.prototype member.
  return Object.hasOwn(SERVICE_ICONS, slug)
    ? SERVICE_ICONS[slug]
    : DEFAULT_SERVICE_ICON;
}
