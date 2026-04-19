const INDENT = '  ';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isPrimitive(value: unknown): value is string | number | boolean | null {
  return value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
}

function scalar(value: unknown): string {
  if (value === null || value === undefined) {
    return 'null';
  }
  return String(value);
}

function collectKeys(values: Record<string, unknown>[]): string[] {
  const seen = new Set<string>();
  for (const value of values) {
    for (const key of Object.keys(value)) {
      if (!seen.has(key)) {
        seen.add(key);
      }
    }
  }
  return [...seen];
}

function inlineObject(value: Record<string, unknown>): string {
  const parts = Object.entries(value).map(([k, v]) => `${k}:${cellValue(v)}`);
  return `{${parts.join(',')}}`;
}

function arrayOfPrimitives(values: unknown[]): boolean {
  return values.every(isPrimitive);
}

function arrayOfObjects(values: unknown[]): values is Record<string, unknown>[] {
  return values.every(isPlainObject);
}

function compactObjectArray(values: Record<string, unknown>[]): string {
  const keys = collectKeys(values);
  const rows = values.map(obj => keys.map(k => cellValue(obj[k] ?? null)).join(','));
  return `[${values.length}]{${keys.join(',')}}:${rows.join(';')}`;
}

function compactMixedArray(values: unknown[]): string {
  return `[${values.map(value => cellValue(value)).join(',')}]`;
}

function cellValue(value: unknown): string {
  if (isPrimitive(value)) {
    return scalar(value);
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return '[]';
    }

    if (arrayOfPrimitives(value)) {
      return `[${value.map(scalar).join(',')}]`;
    }

    if (arrayOfObjects(value)) {
      return compactObjectArray(value);
    }

    return compactMixedArray(value);
  }

  if (isPlainObject(value)) {
    return inlineObject(value);
  }

  return scalar(value);
}

function formatArray(values: unknown[], key: string, indent: number): string {
  const prefix = INDENT.repeat(indent);
  const keyPrefix = key ? `${key}` : '';

  if (values.length === 0) {
    return `${prefix}${keyPrefix}[0]:`;
  }

  if (arrayOfPrimitives(values)) {
    return `${prefix}${keyPrefix}[${values.length}]: [${values.map(scalar).join(',')}]`;
  }

  if (arrayOfObjects(values)) {
    const keys = collectKeys(values);
    const header = `${prefix}${keyPrefix}[${values.length}]{${keys.join(',')}}:`;
    const rows = values.map(obj => {
      const row = keys.map(k => cellValue(obj[k] ?? null)).join(',');
      return `${prefix}${INDENT}${row}`;
    });
    return [header, ...rows].join('\n');
  }

  const header = `${prefix}${keyPrefix}[${values.length}]:`;
  const rows = values.map(v => `${prefix}${INDENT}${cellValue(v)}`);
  return [header, ...rows].join('\n');
}

function formatObject(value: Record<string, unknown>, indent: number): string {
  const prefix = INDENT.repeat(indent);
  const lines: string[] = [];

  for (const [key, entry] of Object.entries(value)) {
    if (Array.isArray(entry)) {
      lines.push(formatArray(entry, key, indent));
      continue;
    }

    if (isPlainObject(entry)) {
      lines.push(`${prefix}${key}:`);
      lines.push(formatObject(entry, indent + 1));
      continue;
    }

    lines.push(`${prefix}${key}: ${scalar(entry)}`);
  }

  return lines.join('\n');
}

export function toDSL(value: unknown, indent: number = 0): string {
  if (Array.isArray(value)) {
    return formatArray(value, '', indent).trimEnd();
  }
  if (isPlainObject(value)) {
    return formatObject(value, indent).trimEnd();
  }
  return `${INDENT.repeat(indent)}${scalar(value)}`.trimEnd();
}

export function formatOutput(data: unknown, prettyPrint: boolean = false): string {
  return prettyPrint ? JSON.stringify(data, null, 2) : JSON.stringify(data);
}

// DSL Parser
export function parseDSL(dsl: string): unknown {
  const lines = dsl.split('\n').map(line => {
    const indent = line.length - line.trimStart().length;
    return { indent, text: line.trim() };
  }).filter(line => line.text);
  const { value } = parseBlock(lines, 0, 0);
  return value;
}

function parseBlock(lines: { indent: number; text: string }[], start: number, level: number): { value: unknown; nextIndex: number } {
  const obj: Record<string, unknown> = {};
  let i = start;

  while (i < lines.length && lines[i].indent >= level) {
    if (lines[i].indent !== level) {
      i++;
      continue;
    }

    const line = lines[i].text;
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) {
      i++;
      continue;
    }

    const key = line.slice(0, colonIndex).trim();
    const valueStr = line.slice(colonIndex + 1).trim();
    const nextIndent = i + 1 < lines.length ? lines[i + 1].indent : -1;

    if (valueStr === '' && nextIndent > level) {
      const arrayMatch = key.match(/^(.+)\[(\d+)\](?:\{([^}]+)\})?$/);
      if (arrayMatch) {
        const { value, nextIndex } = parseArrayBlock(lines, i + 1, nextIndent, key);
        obj[arrayMatch[1]] = value;
        i = nextIndex;
        continue;
      }

      const { value, nextIndex } = parseBlock(lines, i + 1, nextIndent);
      obj[key] = value;
      i = nextIndex;
      continue;
    }

    obj[key] = valueStr === '' ? {} : parseValue(valueStr);
    i++;
  }

  return { value: obj, nextIndex: i };
}

function parseArrayBlock(lines: { indent: number; text: string }[], start: number, level: number, header: string): { value: unknown[]; nextIndex: number } {
  const match = header.match(/^(.+)\[(\d+)\](?:\{([^}]+)\})?$/);
  if (!match) return { value: [], nextIndex: start };
  const keys = match[3] ? splitTopLevel(match[3], ',') : null;
  const rows: string[] = [];
  let i = start;
  while (i < lines.length && lines[i].indent >= level) {
    if (lines[i].indent === level) {
      rows.push(lines[i].text);
    }
    i++;
  }
  const value = rows.map(row => {
    const values = splitTopLevel(row, ',').map(v => parseCellValue(v));
    if (!keys) {
      return values;
    }
    const obj: Record<string, unknown> = {};
    keys.forEach((key, idx) => {
      const item = values[idx];
      if (item !== null) obj[key.trim()] = item;
    });
    return obj;
  });
  return { value, nextIndex: i };
}

function splitTopLevel(input: string, separator: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let inQuotes = false;
  let current = '';

  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (char === '"') {
      inQuotes = !inQuotes;
      current += char;
      continue;
    }

    if (!inQuotes) {
      if (char === '[' || char === '{') {
        depth++;
      } else if (char === ']' || char === '}') {
        depth = Math.max(0, depth - 1);
      }
    }

    if (char === separator && depth === 0 && !inQuotes) {
      parts.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  parts.push(current);
  return parts.map(part => part.trim());
}

function parseCellValue(str: string): unknown {
  const value = str.trim();
  if (value === 'null') return null;
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value.startsWith('"') && value.endsWith('"')) return value.slice(1, -1);

  const compactArrayMatch = value.match(/^\[(\d+)\](?:\{([^}]+)\})?:(.+)$/);
  if (compactArrayMatch) {
    return parseCompactArray(value);
  }

  if (value.startsWith('{') && value.endsWith('}')) {
    const content = value.slice(1, -1);
    if (content === '') return {};
    const pairs = splitTopLevel(content, ',');
    const obj: Record<string, unknown> = {};
    pairs.forEach(pair => {
      const splitIndex = pair.indexOf(':');
      const key = pair.slice(0, splitIndex).trim();
      const raw = pair.slice(splitIndex + 1).trim();
      obj[key] = parseCellValue(raw);
    });
    return obj;
  }

  if (value.startsWith('[') && value.endsWith(']')) {
    const inner = value.slice(1, -1);
    if (inner === '') return [];
    return splitTopLevel(inner, ',').map(v => parseCellValue(v));
  }

  if (/^-?\d+(?:\.\d+)?$/.test(value)) {
    return parseFloat(value);
  }

  return value;
}

function parseCompactArray(str: string): unknown[] {
  const match = str.match(/^\[(\d+)\](?:\{([^}]+)\})?:(.+)$/);
  if (!match) return [];
  const keys = match[2] ? splitTopLevel(match[2], ',') : null;
  const rowsStr = match[3];
  const rows = splitTopLevel(rowsStr, ';');
  if (keys) {
    return rows.map(row => {
      const values = splitTopLevel(row, ',').map(v => parseCellValue(v));
      const obj: Record<string, unknown> = {};
      keys.forEach((key, idx) => {
        if (values[idx] !== null) obj[key] = values[idx];
      });
      return obj;
    });
  }

  return rows.map(row => parseCellValue(row));
}

function parseValue(str: string): unknown {
  return parseCellValue(str);
}
