"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OptimizerService = void 0;
const toon_service_1 = require("./toon.service");
const tokenEstimator_service_1 = require("./tokenEstimator.service");
const minifier_1 = require("../utils/minifier");
class OptimizerService {
    constructor() {
        this.toonService = new toon_service_1.ToonService();
        this.tokenEstimator = new tokenEstimator_service_1.TokenEstimatorService();
    }
    optimize(input) {
        const originalJson = (0, minifier_1.minifyJson)(input);
        const originalStats = this.tokenEstimator.estimateTokens(originalJson);
        const transformed = this.transformHybrid(input);
        const optimizedJson = (0, minifier_1.minifyJson)(transformed.value);
        const optimizedStats = this.tokenEstimator.estimateTokens(optimizedJson);
        const savedTokens = Math.max(0, originalStats.tokens - optimizedStats.tokens);
        const savedPercent = originalStats.tokens > 0
            ? Math.round((savedTokens / originalStats.tokens) * 100)
            : 0;
        return {
            format: transformed.usedToon ? 'toon' : 'json',
            output: optimizedJson,
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
        if (value.length < 2) {
            return false;
        }
        const isObjectArray = value.every(item => this.isPlainObject(item));
        if (!isObjectArray) {
            return false;
        }
        const keySet = new Set();
        let commonKeys = null;
        for (const item of value) {
            const keys = Object.keys(item);
            const keySlice = new Set(keys);
            keys.forEach(k => keySet.add(k));
            if (commonKeys === null) {
                commonKeys = keySlice;
            }
            else {
                const intersection = new Set();
                for (const key of commonKeys) {
                    if (keySlice.has(key)) {
                        intersection.add(key);
                    }
                }
                commonKeys = intersection;
            }
        }
        return keySet.size > 1 && (commonKeys?.size ?? 0) > 0;
    }
    transformHybrid(value) {
        if (this.shouldUseToon(value)) {
            const objects = value;
            const transformedObjects = objects.map(obj => {
                const transformedObject = {};
                for (const [key, item] of Object.entries(obj)) {
                    transformedObject[key] = this.transformHybrid(item).value;
                }
                return transformedObject;
            });
            return {
                value: this.toonService.convertObjectArrayToToon(transformedObjects),
                usedToon: true
            };
        }
        if (Array.isArray(value)) {
            let usedToon = false;
            const transformedArray = value.map(item => {
                const transformed = this.transformHybrid(item);
                usedToon = usedToon || transformed.usedToon;
                return transformed.value;
            });
            return { value: transformedArray, usedToon };
        }
        if (this.isPlainObject(value)) {
            const transformedObject = {};
            let usedToon = false;
            for (const [key, item] of Object.entries(value)) {
                const transformed = this.transformHybrid(item);
                transformedObject[key] = transformed.value;
                usedToon = usedToon || transformed.usedToon;
            }
            return { value: transformedObject, usedToon };
        }
        return { value, usedToon: false };
    }
    isPlainObject(value) {
        return typeof value === 'object' && value !== null && !Array.isArray(value);
    }
}
exports.OptimizerService = OptimizerService;
//# sourceMappingURL=optimizer.service.js.map