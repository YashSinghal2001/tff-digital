import type { WPMenu, WPMenuItem } from "@/types/api/wp-menu";
import type { NavigationItem, NavigationMenu } from "@/types/domain/navigation";

function adaptMenuItem(wpItem: WPMenuItem): NavigationItem {
  return {
    id: wpItem.id,
    label: wpItem.label,
    url: wpItem.url,
    target: wpItem.target === "_blank" ? "_blank" : "_self",
    children: wpItem.childItems?.nodes.map(adaptMenuItem) ?? [],
  };
}

export function adaptNavigationMenu(wpMenu: WPMenu): NavigationMenu {
  return {
    name: wpMenu.name,
    items: wpMenu.menuItems.nodes.map(adaptMenuItem),
  };
}
