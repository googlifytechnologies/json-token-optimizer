"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isObject = exports.isPrimitive = void 0;
function isPrimitive(value) {
    return value === null || typeof value !== 'object';
}
exports.isPrimitive = isPrimitive;
function isObject(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
exports.isObject = isObject;
//# sourceMappingURL=typeGuards.js.map