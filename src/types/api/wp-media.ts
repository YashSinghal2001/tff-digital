export interface WPMediaDetails {
  width: number | null;
  height: number | null;
}

export interface WPMediaItem {
  id: string;
  sourceUrl: string;
  altText: string | null;
  mediaDetails: WPMediaDetails | null;
}
