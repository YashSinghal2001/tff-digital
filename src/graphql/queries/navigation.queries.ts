import { gql } from "@/graphql/gql";

const MENU_ITEM_FIELDS = gql`
  fragment MenuItemFields on MenuItem {
    id
    label
    url
    target
  }
`;

export const GET_MENU_BY_LOCATION = gql`
  query GetMenuByLocation($location: MenuLocationEnum!) {
    menus(where: { location: $location }, first: 1) {
      nodes {
        name
        menuItems(first: 50) {
          nodes {
            ...MenuItemFields
            childItems {
              nodes {
                ...MenuItemFields
              }
            }
          }
        }
      }
    }
  }
  ${MENU_ITEM_FIELDS}
`;
