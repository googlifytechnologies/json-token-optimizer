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
      d: [[1, 2], [3, undefined]]
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

    const jsonResult = optimizer.optimize({ a: 1, b: 2 }, { prettyPrint: false });
    assert.equal(jsonResult.format, 'json');

    const largeArray = Array.from({ length: 1000 }, (_, i) => ({
      id: i,
      name: `user-${i}`,
      active: i % 2 === 0,
      score: i * 3,
      group: i % 10
    }));

    const toonResult = optimizer.optimize(largeArray, { prettyPrint: false });
    assert.equal(toonResult.format, 'toon');
    assert.ok(toonResult.stats.savedPercent > 0);
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
