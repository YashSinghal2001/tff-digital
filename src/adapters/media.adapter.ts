import type { WPMediaItem } from "@/types/api/wp-media";
import type { Media } from "@/types/domain/media";

export function adaptMedia(wpMedia: WPMediaItem): Media {
  return {
    id: wpMedia.id,
    url: wpMedia.sourceUrl,
    altText: wpMedia.altText ?? "",
    width: wpMedia.mediaDetails?.width ?? null,
    height: wpMedia.mediaDetails?.height ?? null,
  };
}
