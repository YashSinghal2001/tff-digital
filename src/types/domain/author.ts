import type { Media } from "@/types/domain/media";

export interface Author {
  id: string;
  name: string;
  slug: string;
  avatar: Media | null;
  bio: string | null;
}
