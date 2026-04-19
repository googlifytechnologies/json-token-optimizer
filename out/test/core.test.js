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
            d: [[1, 2], [3, null]]
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
        const jsonResult = optimizer.optimize({ a: 1, b: 2 });
        assert_1.strict.equal(jsonResult.format, 'json');
        const largeArray = Array.from({ length: 1000 }, (_, i) => ({
            id: i,
            name: `user-${i}`,
            active: i % 2 === 0,
            score: i * 3,
            group: i % 10
        }));
        const toonResult = optimizer.optimize(largeArray);
        assert_1.strict.equal(toonResult.format, 'toon');
    });
    it('uses hybrid optimization for repetitive arrays while preserving non-repetitive sections', () => {
        const optimizer = new optimizer_service_1.OptimizerService();
        const input = {
            orders: [
                { id: 1, name: 'A' },
                { id: 2, name: 'B' }
            ],
            cart: [
                { sku: 'sku-1', qty: 2 },
                { sku: 'sku-2', qty: 1 }
            ],
            user: { id: 100, tier: 'gold' },
            meta: { source: 'web', locale: 'en' },
            tags: ['fast', 'stable'],
            mixed: [1, { k: 'v' }]
        };
        const result = optimizer.optimize(input);
        const output = JSON.parse(result.output);
        assert_1.strict.equal(result.format, 'toon');
        assert_1.strict.deepEqual(output.orders, {
            k: ['id', 'name'],
            d: [[1, 'A'], [2, 'B']]
        });
        assert_1.strict.deepEqual(output.cart, {
            k: ['qty', 'sku'],
            d: [[2, 'sku-1'], [1, 'sku-2']]
        });
        assert_1.strict.deepEqual(output.user, input.user);
        assert_1.strict.deepEqual(output.meta, input.meta);
        assert_1.strict.deepEqual(output.tags, input.tags);
        assert_1.strict.deepEqual(output.mixed, input.mixed);
    });
    it('evaluates nested arrays recursively and keeps final output minified', () => {
        const optimizer = new optimizer_service_1.OptimizerService();
        const input = {
            user: {
                id: 1,
                addresses: [
                    { city: 'A', zip: '1000' },
                    { city: 'B', zip: '2000' }
                ]
            },
            orders: [
                {
                    id: 'o1',
                    items: [
                        { sku: 's1', qty: 2 },
                        { sku: 's2', qty: 1 }
                    ]
                },
                {
                    id: 'o2',
                    items: [
                        { sku: 's3', qty: 4 },
                        { sku: 's4', qty: 2 }
                    ]
                }
            ],
            cart: [
                { sku: 'c1', qty: 1 },
                { sku: 'c2', qty: 3 }
            ]
        };
        const result = optimizer.optimize(input);
        const output = JSON.parse(result.output);
        assert_1.strict.equal(result.format, 'toon');
        assert_1.strict.equal(result.output.includes('\n'), false);
        assert_1.strict.equal(result.output.includes('  '), false);
        assert_1.strict.deepEqual(output.user.addresses, {
            k: ['city', 'zip'],
            d: [['A', '1000'], ['B', '2000']]
        });
        assert_1.strict.deepEqual(output.cart, {
            k: ['qty', 'sku'],
            d: [[1, 'c1'], [3, 'c2']]
        });
        const orders = output.orders;
        const orderRows = orders.d;
        const firstOrder = orderRows[0];
        const secondOrder = orderRows[1];
        assert_1.strict.deepEqual(firstOrder[1], {
            k: ['qty', 'sku'],
            d: [[2, 's1'], [1, 's2']]
        });
        assert_1.strict.deepEqual(secondOrder[1], {
            k: ['qty', 'sku'],
            d: [[4, 's3'], [2, 's4']]
        });
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