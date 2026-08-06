export interface PageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor: string | null;
  endCursor: string | null;
}

export interface Paginated<TItem> {
  items: TItem[];
  pageInfo: PageInfo;
  totalCount: number;
}
