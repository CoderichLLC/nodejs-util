const ObjectId = require('bson-objectid');
const Util = require('../src/index');

describe('utils', () => {
  test('flatten', () => {
    const oid = new ObjectId();
    expect(Util.flatten(null)).toBeNull();
    expect(Util.flatten(undefined)).toBeUndefined();
    expect(Util.flatten('A string')).toBe('A string');
    expect(Util.flatten(oid)).toBe(oid);
    expect(Util.flatten([])).toEqual([]);
    expect(Util.flatten({})).toEqual({});
    expect(Util.flatten(['a', 'b', 'c'])).toEqual(['a', 'b', 'c']);
    expect(Util.flatten(['a', 'b', 'c'], { safe: true })).toEqual(['a', 'b', 'c']);
    expect(Util.flatten({ a: { b: 'c' } })).toEqual({ 'a.b': 'c' });
    expect(Util.flatten({ a: { b: 1, 'nested.attribute': 2 } }, { strict: true })).toEqual({ 'a.b': 1, "a.['nested.attribute']": 2 });
    expect(Util.flatten({ a: { b: 1, c: [4, 5, 6] } })).toEqual({ 'a.b': 1, 'a.c.0': 4, 'a.c.1': 5, 'a.c.2': 6 });
    expect(Util.flatten({ a: { b: 1, c: [4, 5, 6] } }, { safe: true })).toEqual({ 'a.b': 1, 'a.c': [4, 5, 6] });
  });

  test('unflatten', () => {
    const oid = new ObjectId();
    expect(Util.unflatten(oid)).toEqual(oid);
    expect(Util.unflatten(oid, { safe: true })).toEqual(oid);
    expect(Util.unflatten(['a', 'b', 'c'], { safe: true })).toEqual(['a', 'b', 'c']);
    expect(Util.unflatten({ 'a.b.c': 'd' })).toEqual({ a: { b: { c: 'd' } } });
    expect(Util.unflatten({ a: { b: { c: 'd' } } })).toEqual({ a: { b: { c: 'd' } } });
  });

  test('preserve nested keys', () => {
    const obj = { a: { b: 1, 'nested.attribute': 2 } };
    expect(Util.unflatten(Util.flatten(obj, { strict: true }))).toEqual(obj);
  });

  test('promiseChain', async () => {
    expect(await Util.promiseChain([
      () => Util.timeout(300).then(() => 'hello'),
      () => Util.timeout(100).then(() => 'world'),
    ])).toEqual(['hello', 'world']);
  });

  test('pipeline', async () => {
    expect(await Util.pipeline([
      value => Util.timeout(300).then(() => value * 10),
      () => undefined,
      value => Util.timeout(100).then(() => value + 3),
    ], 10)).toEqual(103);

    expect(await Util.pipeline([
      value => Util.timeout(300).then(() => value * 10),
      () => 30,
      value => Util.timeout(100).then(() => value + 3),
    ])).toEqual(33);

    expect(await Util.pipeline([
      () => 30,
      value => Util.timeout(300).then(() => value * 10),
      value => Util.timeout(100).then(() => value + 3),
    ])).toEqual(303);
  });
});
