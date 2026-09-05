/**
 * Editorial ordering for service lists: ACF `display_order` ascending, with
 * unordered services after the ordered ones and title as the deterministic
 * tie-break. WPGraphQL cannot order by an ACF field, so the repository hands
 * back WordPress's default (newest first) and the service layer applies this.
 */
export function sortByDisplayOrder<
  T extends { order: number | null; title: string },
>(services: readonly T[]): T[] {
  return [...services].sort((a, b) => {
    if (a.order !== null && b.order !== null && a.order !== b.order) {
      return a.order - b.order;
    }
    if (a.order === null && b.order !== null) return 1;
    if (a.order !== null && b.order === null) return -1;
    return a.title.localeCompare(b.title);
  });
}
