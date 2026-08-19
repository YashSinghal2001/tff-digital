import Image from "next/image";
import { cn } from "@/lib/utils";
import type { TeamMember } from "@/data/team";

export interface TeamMemberCardProps {
  member: TeamMember;
  /** Center card of the visible desktop trio (or the single mobile card). */
  emphasized?: boolean;
}

/**
 * One native card of the team carousel: portrait on top, profile below.
 * Portraits are studio cut-outs on the deck's light backdrop, so the image
 * panel deliberately stays light against the dark glass body — the same
 * light-artwork-on-dark-card contrast the section shipped with before.
 */
export function TeamMemberCard({ member, emphasized }: TeamMemberCardProps) {
  return (
    <article
      className={cn(
        "group bg-glass hover:border-primary/60 flex h-full flex-col overflow-hidden rounded-[25px] border transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_36px_0_rgba(56,130,246,0.16)] motion-reduce:transition-none motion-reduce:hover:translate-y-0",
        emphasized
          ? "border-primary/45 shadow-[0_0_28px_0_rgba(56,130,246,0.12)]"
          : "border-border-strong",
      )}
    >
      {/* 1:1 on single-card (sub-md) views keeps the mobile card from
          growing taller than a phone viewport; crops stay face-safe via
          object-top. */}
      <div className="relative aspect-square overflow-hidden bg-white/5 md:aspect-[4/5]">
        <Image
          src={member.image.src}
          alt={member.image.alt}
          fill
          sizes="(min-width: 1280px) 358px, (min-width: 1024px) 30vw, (min-width: 768px) 46vw, 92vw"
          className="object-cover object-top transition-transform duration-500 ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          draggable={false}
        />
      </div>

      <div className="flex flex-1 flex-col p-6">
        <p className="font-body text-primary text-[10px] font-semibold tracking-[0.2em] uppercase">
          {member.company}
        </p>
        <h3 className="font-heading mt-2 text-[22px] leading-tight font-bold text-white">
          {member.name}
        </h3>
        <p className="font-body text-muted mt-1 text-sm font-semibold">
          {member.role}
        </p>

        <span
          aria-hidden="true"
          className="mt-4 h-0.5 w-10 rounded-full bg-[linear-gradient(90deg,var(--color-primary)_0%,var(--color-secondary)_100%)]"
        />

        <p className="font-body mt-4 text-sm leading-relaxed text-white/80">
          {member.bio}
        </p>

        <div className="mt-auto pt-5">
          <p className="border-primary/40 font-body border-l-2 pl-4 text-sm text-white/60 italic">
            {member.personalLine}
          </p>
        </div>
      </div>
    </article>
  );
}
