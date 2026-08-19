export interface TeamMember {
  id: string;
  name: string;
  role: string;
  company: string;
  image: { src: string; alt: string; zoom: number };
  personalLine: string;
}

/**
 * Content transcribed verbatim from the "Meet the Team" spotlight series
 * (the 9-page Canva deck mirrored in the WordPress media library); full
 * founder names match AboutJourney. Do not invent or extend entries here.
 *
 * Portraits in /public/team are the team's transparent cutouts
 * (alpha-trimmed, so each file is exactly the person). `image.zoom`
 * enlarges the figure on the card's fixed-height stage: the portrait is
 * top-anchored, so zoom > 1 pushes only the BOTTOM of the figure past
 * the image/content divider. Each value was chosen from the source
 * composition so nothing above the lowest visible hand is ever cut —
 * e.g. Aniket is full-body (legs can bleed, hence the largest zoom),
 * while Raju's watch and Kanchan's pocketed hand sit near their crop
 * bottoms (small zooms). Re-check hand positions before raising one.
 */
export const teamMembers: TeamMember[] = [
  {
    id: "raju",
    name: "Raju",
    role: "Founder & Performance Marketing Specialist",
    company: "TFF Digital",
    image: {
      src: "/team/raju.webp",
      zoom: 1.08,
      alt: "Raju Gorai, Founder & Performance Marketing Specialist at TFF Digital",
    },
    personalLine:
      "I love meeting new people, exploring new places, chasing Bengali sweets, and disappearing wherever the weather feels magical.",
  },
  {
    id: "kanchan",
    name: "Kanchan",
    role: "Founder & SEO Strategist",
    company: "TFF Digital",
    image: {
      src: "/team/kanchan.webp",
      zoom: 1.07,
      alt: "Kanchan Rana, Founder & SEO Strategist at TFF Digital",
    },
    personalLine:
      "Fueled by music, moved by dance, and completely obsessed with dogs. 🐶🎶💃",
  },
  {
    id: "lalit",
    name: "Lalit",
    role: "Business Development Manager",
    company: "TFF Digital",
    image: {
      src: "/team/lalit.webp",
      zoom: 1.03,
      alt: "Lalit, Business Development Manager at TFF Digital",
    },
    personalLine:
      "Beyond work, I love travelling, trekking, exploring new places, and cooking delicious Indian dishes.",
  },
  {
    id: "aniket",
    name: "Aniket",
    role: "Creative Video Editor",
    company: "TFF Digital",
    image: {
      src: "/team/aniket.webp",
      zoom: 1.48,
      alt: "Aniket, Creative Video Editor at TFF Digital",
    },
    personalLine:
      "Passion drives me, focus keeps me moving, quality is my standard, and collaboration makes the journey better.",
  },
  {
    id: "suraj",
    name: "Suraj",
    role: "SEO Analyst",
    company: "TFF Digital",
    image: {
      src: "/team/suraj.webp",
      zoom: 1.15,
      alt: "Suraj, SEO Analyst at TFF Digital",
    },
    personalLine:
      "Fueled by a passion for cricket, gaming, bikes, technology, music, and the thrill of motorsport.",
  },
  {
    id: "yash",
    name: "Yash",
    role: "Full Stack Developer",
    company: "TFF Digital",
    image: {
      src: "/team/yash.webp",
      zoom: 1.12,
      alt: "Yash, Full Stack Developer at TFF Digital",
    },
    personalLine:
      "I’m passionate about music, love the freedom of bike rides, and enjoy exploring new technologies. I’m always curious to learn, discover, and experience something new.",
  },
];
