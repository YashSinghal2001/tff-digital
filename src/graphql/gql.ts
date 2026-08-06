/**
 * Identity tag for GraphQL document strings. Adds editor syntax highlighting
 * and formatting via tooling conventions without requiring a codegen step.
 *
 * Fragments are shared across query files (e.g. SEO_FRAGMENT embeds
 * MEDIA_FRAGMENT) and interpolated by reference, so the same fragment
 * definition can end up concatenated into one document more than once.
 * WPGraphQL rejects documents that redeclare a fragment name, so duplicate
 * definitions are stripped here, keeping the first occurrence.
 */
export function gql(
  strings: TemplateStringsArray,
  ...values: unknown[]
): string {
  const document = strings.reduce(
    (acc, str, i) => acc + str + (i < values.length ? String(values[i]) : ""),
    "",
  );
  return dedupeFragments(document);
}

function dedupeFragments(document: string): string {
  const fragmentStart = /fragment\s+(\w+)\s+on\s+\w+\s*\{/g;
  const seen = new Set<string>();
  let result = "";
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = fragmentStart.exec(document))) {
    const name = match[1];
    const blockStart = match.index;
    const braceStart = fragmentStart.lastIndex - 1;

    let depth = 1;
    let i = braceStart + 1;
    while (i < document.length && depth > 0) {
      if (document[i] === "{") depth++;
      else if (document[i] === "}") depth--;
      i++;
    }
    const blockEnd = i;

    result += document.slice(cursor, blockStart);
    if (!seen.has(name)) {
      seen.add(name);
      result += document.slice(blockStart, blockEnd);
    }
    cursor = blockEnd;
    fragmentStart.lastIndex = blockEnd;
  }

  result += document.slice(cursor);
  return result;
}
