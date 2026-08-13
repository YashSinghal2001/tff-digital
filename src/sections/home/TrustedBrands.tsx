import { ArrowUpRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { buttonVariants } from "@/components/ui/button-variants";

const UPWORK_PROFILE_URL = "https://www.upwork.com/freelancers/upworkseoexpert";

const stats: Array<{ value: string; label: string }> = [
  { value: "100%", label: "Job Success" },
  { value: "Top Rated Plus", label: "Upwork Status" },
  { value: "72", label: "Total Jobs" },
  { value: "9,444", label: "Total Hours" },
];

function UpworkIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M18.561 13.158c-1.102 0-2.135-.467-3.074-1.227l.228-1.076.008-.042c.207-1.143.849-3.06 2.839-3.06 1.492 0 2.703 1.212 2.703 2.703-.001 1.489-1.212 2.702-2.704 2.702zm0-8.14c-2.539 0-4.51 1.649-5.31 4.366-1.22-1.834-2.148-4.036-2.687-5.892H7.828v7.112c-.002 1.406-1.141 2.546-2.547 2.548-1.405-.002-2.543-1.143-2.545-2.548V3.492H0v7.112c0 2.914 2.37 5.303 5.281 5.303 2.913 0 5.283-2.389 5.283-5.303v-1.19c.529 1.107 1.182 2.229 1.974 3.221l-1.673 7.873h2.797l1.213-5.71c1.063.679 2.285 1.109 3.686 1.109 3 0 5.439-2.452 5.439-5.45 0-3-2.439-5.439-5.439-5.439z" />
    </svg>
  );
}

export function TrustedBrands() {
  return (
    <section className="border-y border-border-subtle py-8">
      <Container
        size="full"
        className="flex max-w-[1280px] flex-col items-center gap-6 text-center lg:flex-row lg:justify-between lg:gap-8 lg:text-left"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border-strong bg-glass text-[#14A800]">
            <UpworkIcon className="h-5 w-5" />
          </span>
          <div>
            <p className="font-heading text-sm font-semibold text-white">Verified on Upwork</p>
            <p className="font-body text-xs text-muted">Kanchan R. — Freelancer Profile</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="font-heading text-base font-bold text-white">{stat.value}</p>
              <p className="font-body text-[11px] uppercase tracking-[0.1em] text-muted">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        <a
          href={UPWORK_PROFILE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({ variant: "outline", size: "sm", className: "gap-2" })}
        >
          View Upwork Profile
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </a>
      </Container>
    </section>
  );
}
