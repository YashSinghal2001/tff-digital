import type { WPConnection } from "@/types/api/wp-connection";

export interface WPMenuItem {
  id: string;
  label: string;
  url: string;
  target: string | null;
  childItems: WPConnection<WPMenuItem> | null;
}

export interface WPMenu {
  name: string;
  menuItems: WPConnection<WPMenuItem>;
}

export interface WPMenuQueryResult {
  menus: WPConnection<WPMenu>;
}
