import "server-only";
import { wordpressConfig } from "@/config/wordpress.config";
import { findPageBySlug } from "@/repositories/content-page.repository";
import { adaptContentPage } from "@/adapters/content-page.adapter";
import { getMockPageBySlug } from "@/lib/mock/pages.mock";
import type { ContentPage } from "@/types/domain/content-page";

export async function getPageBySlug(slug: string): Promise<ContentPage | null> {
  if (wordpressConfig.useMockData) {
    return getMockPageBySlug(slug);
  }

  const { page } = await findPageBySlug(slug);
  return page ? adaptContentPage(page) : null;
}
