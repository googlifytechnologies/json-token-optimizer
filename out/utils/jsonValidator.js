"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateJson = void 0;
function validateJson(input) {
    if (!input || input.trim().length === 0) {
        return { isValid: false, error: 'Input is empty' };
    }
    try {
        const data = JSON.parse(input);
        return { isValid: true, data };
    }
    catch (error) {
        return { isValid: false, error: `Invalid JSON: ${error.message}` };
    }
}
exports.validateJson = validateJson;
//# sourceMappingURL=jsonValidator.js.map