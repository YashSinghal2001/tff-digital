/**
 * Identity tag for GraphQL document strings. Adds editor syntax highlighting
 * and formatting via tooling conventions without requiring a codegen step.
 */
export function gql(
  strings: TemplateStringsArray,
  ...values: unknown[]
): string {
  return strings.reduce(
    (acc, str, i) => acc + str + (i < values.length ? String(values[i]) : ""),
    "",
  );
}
