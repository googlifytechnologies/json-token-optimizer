import { strict as assert } from 'assert';
import { OptimizerService } from '../services/optimizer.service';
import { ToonService } from '../services/toon.service';
import { validateJson } from '../utils/jsonValidator';

describe('Core conversion and optimization', () => {
  it('converts arrays of objects and fills missing keys with null after serialization', () => {
    const service = new ToonService();
    const result = service.convert([{ a: 1, b: 2 }, { a: 3 }]);

    assert.equal(result.success, true);
    assert.deepEqual(result.toon, {
      k: ['a', 'b'],
      d: [[1, 2], [3, null]]
    });

    const serialized = JSON.stringify(result.toon);
    assert.equal(serialized, '{"k":["a","b"],"d":[[1,2],[3,null]]}');
  });

  it('supports recursive conversion for nested objects and arrays', () => {
    const service = new ToonService();
    const result = service.convert({
      users: [{ name: 'Alice', age: 30 }],
      meta: { page: 1, tags: ['x', 'y'] }
    });

    assert.equal(result.success, true);
    assert.ok(result.toon);
    const serialized = JSON.stringify(result.toon);
    assert.equal(
      serialized,
      '{"k":["users","meta"],"d":[{"k":["age","name"],"d":[[30,"Alice"]]},{"k":["page","tags"],"d":[1,["x","y"]]}]}'
    );
  });

  it('auto-selects json for small object and toon for large array of objects', () => {
    const optimizer = new OptimizerService();

    const jsonResult = optimizer.optimize({ a: 1, b: 2 });
    assert.equal(jsonResult.format, 'json');

    const largeArray = Array.from({ length: 1000 }, (_, i) => ({
      id: i,
      name: `user-${i}`,
      active: i % 2 === 0,
      score: i * 3,
      group: i % 10
    }));

    const toonResult = optimizer.optimize(largeArray);
    assert.equal(toonResult.format, 'toon');
  });

  it('uses hybrid optimization for repetitive arrays while preserving non-repetitive sections', () => {
    const optimizer = new OptimizerService();
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
    const output = JSON.parse(result.output) as Record<string, unknown>;

    assert.equal(result.format, 'toon');
    assert.deepEqual(output.orders, {
      k: ['id', 'name'],
      d: [[1, 'A'], [2, 'B']]
    });
    assert.deepEqual(output.cart, {
      k: ['qty', 'sku'],
      d: [[2, 'sku-1'], [1, 'sku-2']]
    });
    assert.deepEqual(output.user, input.user);
    assert.deepEqual(output.meta, input.meta);
    assert.deepEqual(output.tags, input.tags);
    assert.deepEqual(output.mixed, input.mixed);
  });

  it('evaluates nested arrays recursively and keeps final output minified', () => {
    const optimizer = new OptimizerService();
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
    const output = JSON.parse(result.output) as Record<string, unknown>;

    assert.equal(result.format, 'toon');
    assert.equal(result.output.includes('\n'), false);
    assert.equal(result.output.includes('  '), false);

    assert.deepEqual((output.user as Record<string, unknown>).addresses, {
      k: ['city', 'zip'],
      d: [['A', '1000'], ['B', '2000']]
    });
    assert.deepEqual(output.cart, {
      k: ['qty', 'sku'],
      d: [[1, 'c1'], [3, 'c2']]
    });

    const orders = output.orders as Record<string, unknown>;
    const orderRows = orders.d as unknown[];
    const firstOrder = orderRows[0] as unknown[];
    const secondOrder = orderRows[1] as unknown[];
    assert.deepEqual(firstOrder[1], {
      k: ['qty', 'sku'],
      d: [[2, 's1'], [1, 's2']]
    });
    assert.deepEqual(secondOrder[1], {
      k: ['qty', 'sku'],
      d: [[4, 's3'], [2, 's4']]
    });
  });
});

describe('JSON validation', () => {
  it('rejects empty input', () => {
    const result = validateJson('   ');
    assert.equal(result.isValid, false);
    assert.equal(result.error, 'Input is empty');
  });

  it('rejects invalid json', () => {
    const result = validateJson('{bad}');
    assert.equal(result.isValid, false);
    assert.ok(result.error?.startsWith('Invalid JSON:'));
  });

  it('accepts valid json', () => {
    const result = validateJson('{"a":1}');
    assert.equal(result.isValid, true);
    assert.deepEqual(result.data, { a: 1 });
  });
});
