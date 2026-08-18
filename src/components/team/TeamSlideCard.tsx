import Image from "next/image";
import type { TeamSlide } from "@/data/team";

export interface TeamSlideCardProps {
  slide: TeamSlide;
}

/**
 * One slide of the team carousel. The artwork is a finished 1:1 design card
 * (name, role, and bio live inside the image), so the frame adds no caption
 * chrome — just the site's card radius/border and the same lift + soft glow
 * hover the founder cards use. No zoom-on-hover: scaling would crop the
 * baked-in layout.
 */
export function TeamSlideCard({ slide }: TeamSlideCardProps) {
  return (
    <div className="border-border-strong hover:border-primary/60 relative aspect-square overflow-hidden rounded-[25px] border bg-white/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_36px_0_rgba(56,130,246,0.16)] motion-reduce:transition-none motion-reduce:hover:translate-y-0">
      <Image
        src={slide.src}
        alt={slide.alt}
        fill
        sizes="(min-width: 1280px) 358px, (min-width: 1024px) 30vw, (min-width: 768px) 46vw, 92vw"
        className="object-cover"
        draggable={false}
      />
    </div>
  );
}
