const ObjectId = require('bson-objectid');
const Utils = require('../src/index');

describe('utils', () => {
  test('flatten', () => {
    const oid = new ObjectId();
    expect(Utils.flatten(null)).toBeNull();
    expect(Utils.flatten(undefined)).toBeUndefined();
    expect(Utils.flatten('A string')).toBe('A string');
    expect(Utils.flatten(oid)).toBe(oid);
    expect(Utils.flatten([])).toEqual([]);
    expect(Utils.flatten({})).toEqual({});
    expect(Utils.flatten(['a', 'b', 'c'])).toEqual(['a', 'b', 'c']);
    expect(Utils.flatten(['a', 'b', 'c'], false)).toEqual(['a', 'b', 'c']);
    expect(Utils.flatten({ a: { b: 'c' } })).toEqual({ 'a.b': 'c' });
    expect(Utils.flatten({ a: { b: 1, 'nested.attribute': 2 } })).toEqual({ 'a.b': 1, "a.['nested.attribute']": 2 });
    expect(Utils.flatten({ a: { b: 1, c: [4, 5, 6] } })).toEqual({ 'a.b': 1, 'a.c.0': 4, 'a.c.1': 5, 'a.c.2': 6 });
    expect(Utils.flatten({ a: { b: 1, c: [4, 5, 6] } }, false)).toEqual({ 'a.b': 1, 'a.c': [4, 5, 6] });
  });

  test('unflatten', () => {
    const oid = new ObjectId();
    expect(Utils.unflatten(oid)).toEqual(oid);
    expect(Utils.unflatten(oid, false)).toEqual(oid);
    expect(Utils.unflatten(['a', 'b', 'c'], false)).toEqual(['a', 'b', 'c']);
  });
});
