export interface NavigationItem {
  id: string;
  label: string;
  url: string;
  target: "_self" | "_blank";
  children: NavigationItem[];
}

export interface NavigationMenu {
  name: string;
  items: NavigationItem[];
}
