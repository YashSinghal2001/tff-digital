export interface TeamMember {
  id: string;
  name: string;
  role: string;
  company: string;
  image: { src: string; alt: string };
  personalLine: string;
}

/**
 * Content transcribed verbatim from the "Meet the Team" spotlight series
 * (the 9-page Canva deck mirrored in the WordPress media library); full
 * founder names match AboutJourney. Do not invent or extend entries here.
 *
 * Portraits in /public/team are extracted from the 2528px deck originals
 * (each member's photo region cropped out of pages 3-8), so the carousel can
 * render native cards instead of the flattened slide artwork. Every crop
 * keeps the person's face in the top portion of the frame — cards display
 * them with `object-cover` + `object-top`, so any container ratio stays
 * face-safe.
 */
export const teamMembers: TeamMember[] = [
  {
    id: "raju",
    name: "Raju",
    role: "Founder & Performance Marketing Specialist",
    company: "TFF Digital",
    image: {
      src: "/team/raju.jpg",
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
      src: "/team/kanchan.jpg",
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
      src: "/team/lalit.jpg",
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
      src: "/team/aniket.jpg",
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
      src: "/team/suraj.jpg",
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
      src: "/team/yash.jpg",
      alt: "Yash, Full Stack Developer at TFF Digital",
    },
    personalLine:
      "I’m passionate about music, love the freedom of bike rides, and enjoy exploring new technologies. I’m always curious to learn, discover, and experience something new.",
  },
];
