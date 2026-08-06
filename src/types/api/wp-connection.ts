export interface WPPageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor: string | null;
  endCursor: string | null;
}

export interface WPConnection<TNode> {
  nodes: TNode[];
  pageInfo: WPPageInfo;
}
