export interface WPAuthorNode {
  id: string;
  name: string;
  slug: string;
  avatar: { url: string } | null;
  description: string | null;
}

export interface WPAuthor {
  node: WPAuthorNode;
}
