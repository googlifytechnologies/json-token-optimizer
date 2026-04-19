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

    const jsonResult = optimizer.optimize({ a: 1, b: 2 }, 'json');
    assert.equal(jsonResult.format, 'json');

    const largeArray = Array.from({ length: 1000 }, (_, i) => ({
      id: i,
      name: `user-${i}`,
      active: i % 2 === 0,
      score: i * 3,
      group: i % 10
    }));

    const toonResult = optimizer.optimize(largeArray, 'toon');
    assert.equal(toonResult.format, 'toon');
  });

  it('applies TOON for any array of objects with length >= 2', () => {
    const optimizer = new OptimizerService();
    const result = optimizer.optimize(
      [{ id: 1 }, { name: 'A' }],
      'toon'
    );

    assert.equal(result.format, 'toon');
    assert.equal(result.output, '{"k":["id","name"],"d":[[1,null],[null,"A"]]}');
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

    const result = optimizer.optimize(input, 'toon');
    const output = JSON.parse(result.output) as Record<string, unknown>;

    assert.equal(result.format, 'toon');
    assert.deepEqual(output.orders, {
      k: ['id', 'name'],
      d: [[1, 'A'], [2, 'B']]
    });
    assert.deepEqual(output.cart, {
      k: ['sku', 'qty'],
      d: [['sku-1', 2], ['sku-2', 1]]
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

    const result = optimizer.optimize(input, 'toon');
    const output = JSON.parse(result.output) as Record<string, unknown>;

    assert.equal(result.format, 'toon');
    assert.equal(result.output.includes('\n'), false);
    assert.equal(result.output.includes('  '), false);

    assert.deepEqual((output.user as Record<string, unknown>).addresses, {
      k: ['city', 'zip'],
      d: [['A', '1000'], ['B', '2000']]
    });
    assert.deepEqual(output.cart, {
      k: ['sku', 'qty'],
      d: [['c1', 1], ['c2', 3]]
    });

    const orders = output.orders as Record<string, unknown>;
    const orderRows = orders.d as unknown[];
    const firstOrder = orderRows[0] as unknown[];
    const secondOrder = orderRows[1] as unknown[];
    assert.deepEqual(firstOrder[1], {
      k: ['sku', 'qty'],
      d: [['s1', 2], ['s2', 1]]
    });
    assert.deepEqual(secondOrder[1], {
      k: ['sku', 'qty'],
      d: [['s3', 4], ['s4', 2]]
    });
  });

  it('does not mutate input while applying recursive hybrid TOON conversion', () => {
    const optimizer = new OptimizerService();
    const input = {
      user: {
        addresses: [
          { city: 'A', zip: '1000' },
          { city: 'B', zip: '2000' }
        ]
      },
      cart: [
        { sku: 'c1', qty: 1 },
        { sku: 'c2', qty: 3 }
      ]
    };
    const snapshot = JSON.parse(JSON.stringify(input));

    const result = optimizer.optimize(input, 'toon');
    assert.equal(result.format, 'toon');
    assert.deepEqual(input, snapshot);
  });

  it('returns transformed output instead of unchanged JSON for repetitive nested arrays', () => {
    const optimizer = new OptimizerService();
    const input = {
      context: {
        task: 'Our favorite hikes together',
        location: 'Boulder',
        season: 'spring_2025'
      },
      friends: ['ana', 'luis', 'sam'],
      hikes: [
        { id: 1, name: 'Blue Lake Trail', distanceKm: 7.5, elevationGain: 320, companion: 'ana', wasSunny: true },
        { id: 2, name: 'Ridge Overlook', distanceKm: 9.2, elevationGain: 540, companion: 'luis', wasSunny: false },
        { id: 3, name: 'Wildflower Loop', distanceKm: 5.1, elevationGain: 180, companion: 'sam', wasSunny: true }
      ]
    };

    const result = optimizer.optimize(input, 'toon');
    const output = JSON.parse(result.output) as Record<string, unknown>;

    assert.equal(result.output !== JSON.stringify(input), true);
    assert.equal(result.format, 'toon');
    assert.deepEqual(output.context, input.context);
    assert.deepEqual(output.friends, input.friends);
    assert.deepEqual(output.hikes, {
      k: ['id', 'name', 'distanceKm', 'elevationGain', 'companion', 'wasSunny'],
      d: [
        [1, 'Blue Lake Trail', 7.5, 320, 'ana', true],
        [2, 'Ridge Overlook', 9.2, 540, 'luis', false],
        [3, 'Wildflower Loop', 5.1, 180, 'sam', true]
      ]
    });
  });

  it('produces DSL output recursively for nested arrays and objects', () => {
    const optimizer = new OptimizerService();
    const input = {
      user: {
        id: 101,
        addresses: [
          { city: 'Boulder', zip: '80301' },
          { city: 'Denver', zip: null }
        ]
      },
      orders: [
        {
          orderId: 'ORD1',
          items: [
            { id: 1, name: 'A' },
            { id: 2, name: 'B' }
          ]
        }
      ],
      cart: [
        { sku: 'S1', qty: 2 },
        { sku: 'S2', qty: 1 }
      ]
    };

    const result = optimizer.optimize(input, 'dsl');
    assert.equal(result.format, 'dsl');
    assert.equal(result.output.includes('{'), true);
    assert.equal(result.output.includes('addresses[2]{city,zip}:'), true);
    assert.equal(result.output.includes('orders[1]{orderId,items}:'), true);
    assert.equal(result.output.includes('[2]{id,name}:'), true);
    assert.equal(result.output.includes('cart[2]{sku,qty}:'), true);
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
