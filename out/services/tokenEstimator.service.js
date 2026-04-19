"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenEstimatorService = void 0;
class TokenEstimatorService {
    estimateTokens(input) {
        const chars = input.length;
        const bytes = Buffer.byteLength(input, 'utf8');
        const tokens = Math.ceil(chars / 4); // Approximation
        return { tokens, bytes, chars };
    }
}
exports.TokenEstimatorService = TokenEstimatorService;
//# sourceMappingURL=tokenEstimator.service.js.map