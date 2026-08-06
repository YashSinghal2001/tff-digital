import "server-only";
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
