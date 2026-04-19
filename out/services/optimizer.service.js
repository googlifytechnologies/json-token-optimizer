"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OptimizerService = void 0;
const tokenEstimator_service_1 = require("./tokenEstimator.service");
const minifier_1 = require("../utils/minifier");
const outputFormatter_1 = require("../utils/outputFormatter");
class OptimizerService {
    constructor() {
        this.tokenEstimator = new tokenEstimator_service_1.TokenEstimatorService();
    }
    optimize(input, mode = 'toon') {
        const originalJson = (0, minifier_1.minifyJson)(input);
        const originalStats = this.tokenEstimator.estimateTokens(originalJson);
        const toonApplied = { value: false };
        const transformedValue = mode === 'toon'
            ? this.optimizeRecursive(input, toonApplied)
            : this.transformRecursive(input);
        const output = mode === 'dsl'
            ? (0, outputFormatter_1.toDSL)(transformedValue)
            : (0, minifier_1.minifyJson)(transformedValue);
        const optimizedStats = this.tokenEstimator.estimateTokens(output);
        const savedTokens = Math.max(0, originalStats.tokens - optimizedStats.tokens);
        const savedPercent = originalStats.tokens > 0
            ? Math.round((savedTokens / originalStats.tokens) * 100)
            : 0;
        return {
            format: mode === 'dsl' ? 'dsl' : (toonApplied.value ? 'toon' : 'json'),
            output,
            stats: {
                originalTokens: originalStats.tokens,
                optimizedTokens: optimizedStats.tokens,
                savedTokens,
                savedPercent
            }
        };
    }
    shouldUseToon(value) {
        if (!Array.isArray(value)) {
            return false;
        }
        return value.every(item => this.isPlainObject(item));
    }
    optimizeRecursive(value, toonApplied) {
        if (Array.isArray(value)) {
            if (this.shouldUseToon(value)) {
                toonApplied.value = true;
                return this.convertArrayToToon(value, toonApplied);
            }
            return value.map(item => this.optimizeRecursive(item, toonApplied));
        }
        if (this.isPlainObject(value)) {
            const transformedObject = {};
            for (const [key, item] of Object.entries(value)) {
                transformedObject[key] = this.optimizeRecursive(item, toonApplied);
            }
            return transformedObject;
        }
        return value;
    }
    transformRecursive(value) {
        if (Array.isArray(value)) {
            return value.map(item => this.transformRecursive(item));
        }
        if (this.isPlainObject(value)) {
            const transformedObject = {};
            for (const [key, item] of Object.entries(value)) {
                transformedObject[key] = this.transformRecursive(item);
            }
            return transformedObject;
        }
        return value;
    }
    convertArrayToToon(arr, toonApplied) {
        const keys = Array.from(new Set(arr.flatMap(obj => Object.keys(obj))));
        const data = arr.map(obj => keys.map(key => this.optimizeRecursive(obj[key] ?? null, toonApplied)));
        return {
            k: keys,
            d: data
        };
    }
    isPlainObject(value) {
        return typeof value === 'object' && value !== null && !Array.isArray(value);
    }
}
exports.OptimizerService = OptimizerService;
//# sourceMappingURL=optimizer.service.js.map