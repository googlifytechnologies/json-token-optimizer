export function formatOutput(data: unknown, prettyPrint: boolean = false): string {
  if (prettyPrint) {
    return JSON.stringify(data, null, 2);
  }
  return JSON.stringify(data);
}
