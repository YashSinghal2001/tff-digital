import Image from "next/image";
import Link from "next/link";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

const LOGO_SRC = "https://cms.tffdigital.com/wp-content/uploads/2026/08/Logo.png";
const LOGO_WIDTH = 467;
const LOGO_HEIGHT = 181;

interface LogoProps {
  className?: string;
  asLink?: boolean;
  priority?: boolean;
}

export function Logo({ className, asLink = true, priority = false }: LogoProps) {
  const image = (
    <Image
      src={LOGO_SRC}
      alt="TFF Digital"
      width={LOGO_WIDTH}
      height={LOGO_HEIGHT}
      priority={priority}
      className={cn("h-10 w-auto object-contain", className)}
    />
  );

  if (!asLink) return image;

  return (
    <Link href={ROUTES.home} aria-label="TFF Digital home" className="flex items-center">
      {image}
    </Link>
  );
}
