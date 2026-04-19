export function extractKeys(objects: Record<string, unknown>[]): string[] {
  const keySet = new Set<string>();
  for (const obj of objects) {
    if (typeof obj === 'object' && obj !== null && !Array.isArray(obj)) {
      Object.keys(obj).forEach(key => keySet.add(key));
    }
  }
  return Array.from(keySet).sort(); // Sort for consistent order
}
