"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatOutput = exports.toDSL = void 0;
const INDENT = '  ';
function isPlainObject(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function isPrimitive(value) {
    return value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
}
function scalar(value) {
    if (value === null || value === undefined) {
        return 'null';
    }
    return String(value);
}
function collectKeys(values) {
    const seen = new Set();
    for (const value of values) {
        for (const key of Object.keys(value)) {
            if (!seen.has(key)) {
                seen.add(key);
            }
        }
    }
    return [...seen];
}
function inlineObject(value) {
    const parts = Object.entries(value).map(([k, v]) => `${k}:${cellValue(v)}`);
    return `{${parts.join(',')}}`;
}
function arrayOfPrimitives(values) {
    return values.every(isPrimitive);
}
function arrayOfObjects(values) {
    return values.every(isPlainObject);
}
function compactObjectArray(values) {
    const keys = collectKeys(values);
    const rows = values.map(obj => keys.map(k => cellValue(obj[k] ?? null)).join(','));
    return `[${values.length}]{${keys.join(',')}}:${rows.join(';')}`;
}
function compactMixedArray(values) {
    return `[${values.map(value => cellValue(value)).join(',')}]`;
}
function cellValue(value) {
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
function formatArray(values, key, indent) {
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
function formatObject(value, indent) {
    const prefix = INDENT.repeat(indent);
    const lines = [];
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
function toDSL(value, indent = 0) {
    if (Array.isArray(value)) {
        return formatArray(value, '', indent).trimEnd();
    }
    if (isPlainObject(value)) {
        return formatObject(value, indent).trimEnd();
    }
    return `${INDENT.repeat(indent)}${scalar(value)}`.trimEnd();
}
exports.toDSL = toDSL;
function formatOutput(data, prettyPrint = false) {
    return prettyPrint ? JSON.stringify(data, null, 2) : JSON.stringify(data);
}
exports.formatOutput = formatOutput;
//# sourceMappingURL=outputFormatter.js.map