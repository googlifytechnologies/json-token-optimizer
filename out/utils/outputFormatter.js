"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatOutput = void 0;
function formatOutput(data, prettyPrint = false) {
    if (prettyPrint) {
        return JSON.stringify(data, null, 2);
    }
    return JSON.stringify(data);
}
exports.formatOutput = formatOutput;
//# sourceMappingURL=outputFormatter.js.map