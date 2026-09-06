import "server-only";
// CQ-2: this WordPress Menu integration is built, boundary-validated (CQ-1),
// and exercised in src/services/boundary-validation.test.ts — but no route
// or layout component calls getNavigationMenu. The live Navbar/Footer
// (src/components/layout/Navbar.tsx, footer-links.ts) render a hardcoded
// link list instead; that's the documented ARCH-1 "hardcoded footer mirror"
// residual, not an oversight here. Kept because it's a real, tested
// integration a future WP-driven-nav effort can call directly — deleting it
// would throw away working code for a feature that may still be wanted.
import { wordpressConfig } from "@/config/wordpress.config";
import { findMenuByLocation } from "@/repositories/navigation.repository";
import { adaptNavigationMenu } from "@/adapters/navigation.adapter";
import { getMockNavigationMenu } from "@/lib/mock/navigation.mock";
import { WP_MENU_LOCATIONS } from "@/constants/content-types";
import type { NavigationMenu } from "@/types/domain/navigation";

export async function getNavigationMenu(
  location: string = WP_MENU_LOCATIONS.primary,
): Promise<NavigationMenu | null> {
  if (wordpressConfig.useMockData) {
    return getMockNavigationMenu("primary");
  }

  const { menus } = await findMenuByLocation(location);
  const menu = menus.nodes[0];
  return menu ? adaptNavigationMenu(menu) : null;
}
