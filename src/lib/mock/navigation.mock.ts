import type { NavigationMenu } from "@/types/domain/navigation";
import { ROUTES } from "@/constants/routes";

export const mockPrimaryNavigation: NavigationMenu = {
  name: "primary",
  items: [
    {
      id: "nav-home",
      label: "Home",
      url: ROUTES.home,
      target: "_self",
      children: [],
    },
    {
      id: "nav-about",
      label: "About",
      url: ROUTES.about,
      target: "_self",
      children: [],
    },
    {
      id: "nav-services",
      label: "Services",
      url: ROUTES.services,
      target: "_self",
      children: [],
    },
    {
      id: "nav-case-studies",
      label: "Case Studies",
      url: ROUTES.caseStudies,
      target: "_self",
      children: [],
    },
    {
      id: "nav-blog",
      label: "Blog",
      url: ROUTES.blog,
      target: "_self",
      children: [],
    },
    {
      id: "nav-contact",
      label: "Contact",
      url: ROUTES.contact,
      target: "_self",
      children: [],
    },
  ],
};

export function getMockNavigationMenu(name: string): NavigationMenu | null {
  return name === mockPrimaryNavigation.name ? mockPrimaryNavigation : null;
}
