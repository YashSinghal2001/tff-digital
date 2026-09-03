import type { WPMenu, WPMenuItem } from "@/types/api/wp-menu";
import type { NavigationItem, NavigationMenu } from "@/types/domain/navigation";

function adaptMenuItem(wpItem: WPMenuItem): NavigationItem {
  return {
    id: wpItem.id,
    label: wpItem.label,
    url: wpItem.url,
    target: wpItem.target === "_blank" ? "_blank" : "_self",
    children: wpItem.childItems?.nodes?.map(adaptMenuItem) ?? [],
  };
}

export function adaptNavigationMenu(wpMenu: WPMenu): NavigationMenu {
  return {
    name: wpMenu.name,
    // WPMenu types menuItems.nodes as always present, but that type is an
    // unvalidated assertion about WordPress's response rather than a
    // guarantee (audit CQ-1) — a connection object returned without .nodes
    // is valid GraphQL and would otherwise throw here (audit PARTIAL-1).
    items: wpMenu.menuItems?.nodes?.map(adaptMenuItem) ?? [],
  };
}
