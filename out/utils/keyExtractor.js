"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractKeys = void 0;
function extractKeys(objects) {
    const keySet = new Set();
    for (const obj of objects) {
        if (typeof obj === 'object' && obj !== null && !Array.isArray(obj)) {
            Object.keys(obj).forEach(key => keySet.add(key));
        }
    }
    return Array.from(keySet).sort(); // Sort for consistent order
}
exports.extractKeys = extractKeys;
//# sourceMappingURL=keyExtractor.js.map