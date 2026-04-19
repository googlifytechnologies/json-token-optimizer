"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToonService = void 0;
const keyExtractor_1 = require("../utils/keyExtractor");
const logger_1 = require("../utils/logger");
const typeGuards_1 = require("../utils/typeGuards");
const MAX_DEPTH = 10;
class ToonService {
    convertObjectArrayToToon(objects) {
        const keys = (0, keyExtractor_1.extractKeys)(objects);
        const rows = objects.map(obj => keys.map(key => {
            const value = obj[key];
            return (value === undefined ? null : value);
        }));
        return { k: keys, d: rows };
    }
    convertToonToJson(toon) {
        const { k: keys, d: data } = toon;
        if (data.length === 0) {
            return [];
        }
        if (Array.isArray(data[0])) {
            return data.map((row) => {
                const obj = {};
                keys.forEach((key, index) => {
                    const value = row[index];
                    if (value !== null) {
                        obj[key] = value;
                    }
                });
                return obj;
            });
        }
        const obj = {};
        keys.forEach((key, index) => {
            const value = data[index];
            if (value !== null) {
                obj[key] = value;
            }
        });
        return [obj];
    }
    convert(data) {
        logger_1.Logger.log('Starting TOON conversion');
        const originalSize = JSON.stringify(data).length;
        try {
            const toon = this.convertToToon(data);
            const toonSize = JSON.stringify(toon).length;
            const sizeReduction = ((originalSize - toonSize) / originalSize) * 100;
            logger_1.Logger.log(`Conversion successful. Size reduction: ${sizeReduction.toFixed(2)}%`);
            return { success: true, toon: toon, sizeReduction };
        }
        catch (error) {
            logger_1.Logger.log(`Conversion failed: ${error.message}`);
            return { success: false, error: `Conversion failed: ${error.message}` };
        }
    }
    convertToToon(value, depth = 0) {
        if (depth > MAX_DEPTH) {
            logger_1.Logger.log(`Max depth reached at level ${depth}, returning value as-is`);
            return value;
        }
        if ((0, typeGuards_1.isPrimitive)(value)) {
            return value;
        }
        if (Array.isArray(value)) {
            return this.convertArray(value, depth);
        }
        if ((0, typeGuards_1.isObject)(value)) {
            return this.convertObject(value, depth);
        }
        return value;
    }
    convertObject(obj, depth) {
        logger_1.Logger.log(`Converting object at depth ${depth}`);
        const keys = Object.keys(obj);
        const values = keys.map(key => this.convertToToon(obj[key], depth + 1));
        return { k: keys, d: values };
    }
    convertArray(arr, depth) {
        logger_1.Logger.log(`Converting array with ${arr.length} items at depth ${depth}`);
        if (arr.length === 0) {
            return [];
        }
        const allObjects = arr.every(item => (0, typeGuards_1.isObject)(item));
        if (!allObjects) {
            logger_1.Logger.log('Array contains non-objects, returning as-is');
            return arr.map(item => this.convertToToon(item, depth + 1));
        }
        // Array of objects
        const processedObjects = arr.map(item => {
            const obj = item;
            const converted = {};
            for (const [key, val] of Object.entries(obj)) {
                converted[key] = this.convertToToon(val, depth + 1);
            }
            return converted;
        });
        const result = this.convertObjectArrayToToon(processedObjects);
        logger_1.Logger.log(`Extracted keys: ${result.k.join(', ')}`);
        return result;
    }
}
exports.ToonService = ToonService;
//# sourceMappingURL=toon.service.js.map