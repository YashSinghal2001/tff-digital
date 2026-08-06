import Link from "next/link";
import { User } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { GradientText } from "@/components/ui/GradientText";
import { buttonVariants } from "@/components/ui/button-variants";
import { Glow } from "@/components/ui/Glow";
import { ROUTES } from "@/constants/routes";

const stats = [
  { value: "320+", label: "Projects Delivered" },
  { value: "98%", label: "Client Satisfaction" },
  { value: "12+", label: "Year Experience" },
];

export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      <Glow className="left-1/2 top-0 h-[420px] w-[420px] -translate-x-1/2 opacity-20" />
      <Container size="full" className="max-w-[1280px] py-10 lg:py-16">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="flex flex-col gap-6">
            <Badge>
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Premium Digital Growth Agency
            </Badge>

            <h1 className="font-heading text-[38px] font-bold leading-[1.15] text-white sm:text-[48px] lg:text-[60px] lg:leading-[1.1]">
              Target Right. <br />
              <GradientText>Find Strategy.</GradientText> <br />
              Finish Strong.
            </h1>

            <p className="max-w-md font-body text-sm leading-relaxed text-muted">
              We don&apos;t sell services — we build digital growth systems that blend
              strategy, creative branding, and measurable performance.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link href={ROUTES.contact} className={buttonVariants({ size: "md" })}>
                Book Free Consultation
              </Link>
              <Link href={ROUTES.services} className={buttonVariants({ variant: "outline", size: "md" })}>
                Explore Services
              </Link>
            </div>

            <div className="flex flex-wrap gap-x-8 gap-y-4 pt-4">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <p className="font-heading text-xl font-bold text-white">{stat.value}</p>
                  <p className="font-body text-xs text-muted">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative mx-auto flex h-[320px] w-[320px] items-center justify-center rounded-full bg-white/5 sm:h-[400px] sm:w-[400px]">
            <User className="h-32 w-32 text-white/20" strokeWidth={1} />

            <Badge className="absolute left-2 top-6" tone="info">
              SEO
            </Badge>
            <Badge className="absolute right-0 top-4" tone="info">
              CRO +64%
            </Badge>
            <Badge className="absolute bottom-8 right-2" tone="info">
              Leads 1,932
            </Badge>
          </div>
        </div>
      </Container>
    </section>
  );
}
