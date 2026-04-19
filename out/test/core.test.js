"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = require("assert");
const optimizer_service_1 = require("../services/optimizer.service");
const toon_service_1 = require("../services/toon.service");
const jsonValidator_1 = require("../utils/jsonValidator");
describe('Core conversion and optimization', () => {
    it('converts arrays of objects and fills missing keys with null after serialization', () => {
        const service = new toon_service_1.ToonService();
        const result = service.convert([{ a: 1, b: 2 }, { a: 3 }]);
        assert_1.strict.equal(result.success, true);
        assert_1.strict.deepEqual(result.toon, {
            k: ['a', 'b'],
            d: [[1, 2], [3, undefined]]
        });
        const serialized = JSON.stringify(result.toon);
        assert_1.strict.equal(serialized, '{"k":["a","b"],"d":[[1,2],[3,null]]}');
    });
    it('supports recursive conversion for nested objects and arrays', () => {
        const service = new toon_service_1.ToonService();
        const result = service.convert({
            users: [{ name: 'Alice', age: 30 }],
            meta: { page: 1, tags: ['x', 'y'] }
        });
        assert_1.strict.equal(result.success, true);
        assert_1.strict.ok(result.toon);
        const serialized = JSON.stringify(result.toon);
        assert_1.strict.equal(serialized, '{"k":["users","meta"],"d":[{"k":["age","name"],"d":[[30,"Alice"]]},{"k":["page","tags"],"d":[1,["x","y"]]}]}');
    });
    it('auto-selects json for small object and toon for large array of objects', () => {
        const optimizer = new optimizer_service_1.OptimizerService();
        const jsonResult = optimizer.optimize({ a: 1, b: 2 }, { prettyPrint: false });
        assert_1.strict.equal(jsonResult.format, 'json');
        const largeArray = Array.from({ length: 1000 }, (_, i) => ({
            id: i,
            name: `user-${i}`,
            active: i % 2 === 0,
            score: i * 3,
            group: i % 10
        }));
        const toonResult = optimizer.optimize(largeArray, { prettyPrint: false });
        assert_1.strict.equal(toonResult.format, 'toon');
        assert_1.strict.ok(toonResult.stats.savedPercent > 0);
    });
});
describe('JSON validation', () => {
    it('rejects empty input', () => {
        const result = (0, jsonValidator_1.validateJson)('   ');
        assert_1.strict.equal(result.isValid, false);
        assert_1.strict.equal(result.error, 'Input is empty');
    });
    it('rejects invalid json', () => {
        const result = (0, jsonValidator_1.validateJson)('{bad}');
        assert_1.strict.equal(result.isValid, false);
        assert_1.strict.ok(result.error?.startsWith('Invalid JSON:'));
    });
    it('accepts valid json', () => {
        const result = (0, jsonValidator_1.validateJson)('{"a":1}');
        assert_1.strict.equal(result.isValid, true);
        assert_1.strict.deepEqual(result.data, { a: 1 });
    });
});
//# sourceMappingURL=core.test.js.map