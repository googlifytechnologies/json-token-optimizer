"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OptimizerService = void 0;
const toon_service_1 = require("./toon.service");
const tokenEstimator_service_1 = require("./tokenEstimator.service");
const minifier_1 = require("../utils/minifier");
const outputFormatter_1 = require("../utils/outputFormatter");
class OptimizerService {
    constructor() {
        this.toonService = new toon_service_1.ToonService();
        this.tokenEstimator = new tokenEstimator_service_1.TokenEstimatorService();
    }
    optimize(input, options = {}) {
        const prettyPrint = options.prettyPrint ?? false;
        const originalJson = (0, minifier_1.minifyJson)(input);
        const originalStats = this.tokenEstimator.estimateTokens(originalJson);
        if (!this.shouldAttemptToon(input)) {
            return this.createJsonResult(input, originalStats.tokens, prettyPrint);
        }
        const conversion = this.toonService.convert(input);
        if (!conversion.success) {
            return this.createJsonResult(input, originalStats.tokens, prettyPrint);
        }
        const toonJson = (0, minifier_1.minifyJson)(conversion.toon);
        const toonStats = this.tokenEstimator.estimateTokens(toonJson);
        if (toonStats.tokens < originalStats.tokens) {
            const savedTokens = originalStats.tokens - toonStats.tokens;
            const savedPercent = Math.round((savedTokens / originalStats.tokens) * 100);
            const output = (0, outputFormatter_1.formatOutput)(conversion.toon, prettyPrint);
            return {
                format: 'toon',
                output,
                stats: {
                    originalTokens: originalStats.tokens,
                    optimizedTokens: toonStats.tokens,
                    savedTokens,
                    savedPercent
                }
            };
        }
        return this.createJsonResult(input, originalStats.tokens, prettyPrint);
    }
    shouldAttemptToon(input) {
        if (Array.isArray(input)) {
            return input.length > 0 && input.every(item => typeof item === 'object' && item !== null && !Array.isArray(item));
        }
        if (typeof input === 'object' && input !== null && !Array.isArray(input)) {
            const record = input;
            const keys = Object.keys(record);
            // Attempt TOON for objects with many keys or nested objects
            return keys.length > 3 || keys.some(key => typeof record[key] === 'object' && record[key] !== null);
        }
        return false;
    }
    createJsonResult(input, tokenCount, prettyPrint) {
        return {
            format: 'json',
            output: (0, outputFormatter_1.formatOutput)(input, prettyPrint),
            stats: {
                originalTokens: tokenCount,
                optimizedTokens: tokenCount,
                savedTokens: 0,
                savedPercent: 0
            }
        };
    }
}
exports.OptimizerService = OptimizerService;
//# sourceMappingURL=optimizer.service.js.map