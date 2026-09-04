import type { ComponentType, SVGProps } from "react";

export type ServiceIconProps = SVGProps<SVGSVGElement>;

/**
 * Custom neon line-art icons for the What We Do service cards.
 * All six share one visual language: 80x80 viewBox, rounded stroke
 * line-work, a cyan → brand blue → brand violet gradient, and a soft
 * bloom filter. Stroke weights: 3 primary shapes, 2.5 secondary, 2 micro.
 */
function NeonIconDefs({ id }: { id: string }) {
  return (
    <defs>
      <linearGradient
        id={`${id}-g`}
        x1="8"
        y1="6"
        x2="72"
        y2="74"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0" stopColor="#38d8f8" />
        <stop offset="0.5" stopColor="#3882f6" />
        <stop offset="1" stopColor="#8b5cf6" />
      </linearGradient>
      <filter id={`${id}-f`} x="-25%" y="-25%" width="150%" height="150%">
        <feGaussianBlur stdDeviation="2.2" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  );
}

const neonGroupProps = (id: string) => ({
  stroke: `url(#${id}-g)`,
  filter: `url(#${id}-f)`,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  fill: "none",
});

export function SeoServiceIcon(props: ServiceIconProps) {
  const id = "tff-svc-seo";
  return (
    <svg viewBox="0 0 80 80" fill="none" aria-hidden="true" {...props}>
      <NeonIconDefs id={id} />
      <g {...neonGroupProps(id)}>
        <circle cx="27" cy="34" r="16" strokeWidth="3" />
        <path d="M15.5 45.5 7 54" strokeWidth="3" />
        <path d="M18 40l9-9 7 6 24-24" strokeWidth="3" />
        <path d="M48 13h10v10" strokeWidth="3" />
        <rect x="44" y="57" width="8" height="11" rx="2" strokeWidth="2.5" />
        <rect x="55" y="50" width="8" height="18" rx="2" strokeWidth="2.5" />
        <rect x="66" y="42" width="8" height="26" rx="2" strokeWidth="2.5" />
        <path d="M67 29h6M70 26v6" strokeWidth="2" />
      </g>
    </svg>
  );
}

export function SmmServiceIcon(props: ServiceIconProps) {
  const id = "tff-svc-smm";
  return (
    <svg viewBox="0 0 80 80" fill="none" aria-hidden="true" {...props}>
      <NeonIconDefs id={id} />
      <g {...neonGroupProps(id)}>
        <path d="M12 33v12l28 12V21L12 33Z" strokeWidth="3" />
        <path d="M19 48v6.5a3.5 3.5 0 0 0 3.5 3.5H27" strokeWidth="2.5" />
        <path d="M46 32a8.5 8.5 0 0 1 0 14" strokeWidth="2.5" />
        <rect x="48" y="6" width="22" height="22" rx="6" strokeWidth="2.5" />
        <circle cx="59" cy="17" r="5" strokeWidth="2.5" />
        <path d="M65.2 10.8h.01" strokeWidth="2.5" />
        <rect x="60" y="36" width="18" height="18" rx="5.5" strokeWidth="2.5" />
        <path
          d="M69 49.5c-2.6-1.9-4.5-3.6-4.5-5.7a2.55 2.55 0 0 1 4.5-1.6 2.55 2.55 0 0 1 4.5 1.6c0 2.1-1.9 3.8-4.5 5.7Z"
          strokeWidth="2"
        />
        <rect x="46" y="58" width="16" height="16" rx="5" strokeWidth="2.5" />
        <circle cx="54" cy="63.5" r="2.4" strokeWidth="2" />
        <path d="M49.6 70.5a4.4 4.4 0 0 1 8.8 0" strokeWidth="2" />
        <path d="M7 13h6M10 10v6" strokeWidth="2" />
      </g>
    </svg>
  );
}

export function MetaAdsServiceIcon(props: ServiceIconProps) {
  const id = "tff-svc-meta";
  return (
    <svg viewBox="0 0 80 80" fill="none" aria-hidden="true" {...props}>
      <NeonIconDefs id={id} />
      <g {...neonGroupProps(id)}>
        <circle cx="47" cy="29" r="21" strokeWidth="3" />
        <circle cx="47" cy="29" r="11.5" strokeWidth="2.5" />
        <path d="M47 29h.01" strokeWidth="4" />
        <path d="M47 4v8" strokeWidth="2.5" />
        <path d="M64 29h8" strokeWidth="2.5" />
        <path d="M14.8 36.8 30.4 74.2l5.5-16.3 16.3-5.5L14.8 36.8Z" strokeWidth="3" />
        <path d="M8 28l4 3" strokeWidth="2.5" />
        <path d="M6 39h5" strokeWidth="2.5" />
        <path d="M11 48l3.6-2.6" strokeWidth="2.5" />
        <path d="M9 12h6M12 9v6" strokeWidth="2" />
      </g>
    </svg>
  );
}

export function WebDevelopmentServiceIcon(props: ServiceIconProps) {
  const id = "tff-svc-web";
  return (
    <svg viewBox="0 0 80 80" fill="none" aria-hidden="true" {...props}>
      <NeonIconDefs id={id} />
      <g {...neonGroupProps(id)}>
        <rect x="7" y="13" width="54" height="42" rx="7" strokeWidth="3" />
        <path d="M7 25h54" strokeWidth="2.5" />
        <path d="M14 19h.01M20 19h.01M26 19h.01" strokeWidth="3" />
        <path d="M23 33.5l-7 7 7 7" strokeWidth="2.5" />
        <path d="M35 33.5l7 7-7 7" strokeWidth="2.5" />
        <path d="M31.5 32l-5 17" strokeWidth="2.5" />
        <rect x="50" y="34" width="22" height="34" rx="6" strokeWidth="3" />
        <path d="M57 40h8" strokeWidth="2.5" />
        <path d="M61 62h.01" strokeWidth="3" />
        <path d="M66 7h6M69 4v6" strokeWidth="2" />
      </g>
    </svg>
  );
}

export function VideoEditingServiceIcon(props: ServiceIconProps) {
  const id = "tff-svc-video";
  return (
    <svg viewBox="0 0 80 80" fill="none" aria-hidden="true" {...props}>
      <NeonIconDefs id={id} />
      <g {...neonGroupProps(id)}>
        <rect x="9" y="15" width="50" height="40" rx="9" strokeWidth="3" />
        <path d="M28 27.5 42.5 35 28 42.5V27.5Z" strokeWidth="2.5" />
        <path d="M17 47.5h16" strokeWidth="2.5" />
        <path d="M37.5 47.5h.01" strokeWidth="3" />
        <path
          d="M63.2 40.8a4.56 4.53 0 1 1 6.4 6.4L48 68.8l-8.8 2.4 2.4-8.8Z"
          strokeWidth="3"
        />
        <path d="m60 44 6.4 6.4" strokeWidth="2.5" />
        <path d="M66 21h6M69 18v6" strokeWidth="2" />
      </g>
    </svg>
  );
}

export function ZohoOneServiceIcon(props: ServiceIconProps) {
  const id = "tff-svc-zoho";
  return (
    <svg viewBox="0 0 80 80" fill="none" aria-hidden="true" {...props}>
      <NeonIconDefs id={id} />
      <g {...neonGroupProps(id)}>
        <rect x="8" y="8" width="24" height="24" rx="6" strokeWidth="3" />
        <rect x="48" y="8" width="24" height="24" rx="6" strokeWidth="3" />
        <rect x="8" y="48" width="24" height="24" rx="6" strokeWidth="3" />
        <rect x="48" y="48" width="24" height="24" rx="6" strokeWidth="3" />
        <circle cx="20" cy="17.5" r="3.5" strokeWidth="2.5" />
        <path d="M14 26.5a6 6 0 0 1 12 0" strokeWidth="2" />
        <path d="M55 26v-5M60 26v-9M65 26v-13" strokeWidth="2.5" />
        <path d="M14 57h12M14 62h12M14 67h7" strokeWidth="2.5" />
        <path d="m54 60 4.5 4.5L67 55.5" strokeWidth="2.5" />
        <path d="M36 40h8M40 36v8" strokeWidth="2" />
      </g>
    </svg>
  );
}

const SERVICE_CARD_ICONS: Record<string, ComponentType<ServiceIconProps>> = {
  seo: SeoServiceIcon,
  smm: SmmServiceIcon,
  "social-media-marketing": SmmServiceIcon,
  "google-meta-ads": MetaAdsServiceIcon,
  "google-ads": MetaAdsServiceIcon,
  ppc: MetaAdsServiceIcon,
  "web-development": WebDevelopmentServiceIcon,
  "website-design-development": WebDevelopmentServiceIcon,
  "video-editing": VideoEditingServiceIcon,
  "zoho-one": ZohoOneServiceIcon,
};

export function getServiceCardIcon(slug: string): ComponentType<ServiceIconProps> {
  return SERVICE_CARD_ICONS[slug] ?? SeoServiceIcon;
}
