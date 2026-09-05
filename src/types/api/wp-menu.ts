// Nodes-only, not WPConnection: GET_MENU_BY_LOCATION selects no pageInfo on
// menus, menuItems or childItems (same reasoning as the nested connections
// in wp-post.ts), and a child item selects no childItems of its own — hence
// optional. Claiming otherwise would make the boundary schema reject every
// real reply (audit CQ-1).
export interface WPMenuItem {
  id: string;
  label: string;
  url: string;
  target: string | null;
  childItems?: { nodes: WPMenuItem[] } | null;
}

export interface WPMenu {
  name: string;
  menuItems: { nodes: WPMenuItem[] };
}

export interface WPMenuQueryResult {
  menus: { nodes: WPMenu[] };
}
