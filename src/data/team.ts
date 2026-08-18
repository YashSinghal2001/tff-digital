export interface TeamSlide {
  id: string;
  src: string;
  alt: string;
}

/**
 * The "Meet the Team" spotlight series from the WordPress media library.
 * Each PNG is a finished 1:1 design card — branding, name, role, and bio
 * are baked into the artwork — so slides must always render uncropped at
 * their native square aspect ratio. Names and roles in the alt text are
 * transcribed from the artwork (full founder names from AboutJourney);
 * do not invent or extend them here.
 *
 * srcs point at WordPress's own 1024x1024 renditions, not the 2528px
 * originals (N.png): the CMS host transfers at ~400KB/s, so the 3-4MB
 * originals blow through next/image's fixed 7s upstream timeout and 500
 * on every request (same constraint documented on minimumCacheTTL in
 * next.config.ts). The ~500KB renditions fetch in ~1.5s and exceed the
 * largest rendered size (~750 device px), so nothing is lost visually.
 */
export const teamSlides: TeamSlide[] = [
  {
    id: "who-we-are",
    src: "https://cms.tffdigital.com/wp-content/uploads/2026/08/1-1024x1024.png",
    alt: "Who We Are — the TFF Digital team brings strategy, creativity, and performance together",
  },
  {
    id: "meet-our-team",
    src: "https://cms.tffdigital.com/wp-content/uploads/2026/08/2-1024x1024.png",
    alt: "Meet Our Team — the people behind the work: experienced, collaborative, and ready to make an impact",
  },
  {
    id: "raju",
    src: "https://cms.tffdigital.com/wp-content/uploads/2026/08/3-1024x1024.png",
    alt: "Raju Gorai — Founder & Performance Marketing Specialist",
  },
  {
    id: "kanchan",
    src: "https://cms.tffdigital.com/wp-content/uploads/2026/08/4-1024x1024.png",
    alt: "Kanchan Rana — Founder & SEO Strategist",
  },
  {
    id: "lalit",
    src: "https://cms.tffdigital.com/wp-content/uploads/2026/08/5-1024x1024.png",
    alt: "Lalit — Business Development Manager",
  },
  {
    id: "aniket",
    src: "https://cms.tffdigital.com/wp-content/uploads/2026/08/6-1024x1024.png",
    alt: "Aniket — Creative Video Editor",
  },
  {
    id: "suraj",
    src: "https://cms.tffdigital.com/wp-content/uploads/2026/08/7-1024x1024.png",
    alt: "Suraj — SEO Analyst",
  },
  {
    id: "yash",
    src: "https://cms.tffdigital.com/wp-content/uploads/2026/08/8-1024x1024.png",
    alt: "Yash — Full Stack Developer",
  },
  {
    id: "lets-work-together",
    src: "https://cms.tffdigital.com/wp-content/uploads/2026/08/9-1024x1024.png",
    alt: "Let's Work Together — reach out to TFF Digital to start a conversation",
  },
];
