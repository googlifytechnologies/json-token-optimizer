export function isPrimitive(value: unknown): boolean {
  return value === null || typeof value !== 'object';
}

export function isObject(value: unknown): boolean {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}