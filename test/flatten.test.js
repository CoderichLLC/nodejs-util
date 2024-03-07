const ObjectId = require('bson-objectid');
const Util = require('../src/index');

describe('Util.flatten', () => {
  test('flatten', () => {
    const oid = new ObjectId();
    expect(Util.flatten(null)).toBeNull();
    expect(Util.flatten(undefined)).toBeUndefined();
    expect(Util.flatten('A string')).toBe('A string');
    expect(Util.flatten(oid)).toBe(oid);
    expect(Util.flatten([])).toEqual([]);
    expect(Util.flatten({ arr: [] })).toEqual({ arr: [] });
    expect(Util.flatten({})).toEqual({});
    expect(Util.flatten({ obj: {} })).toEqual({ obj: {} });
    expect(Util.flatten(['a', 'b', 'c'])).toEqual(['a', 'b', 'c']);
    expect(Util.flatten(['a', 'b', 'c'], { safe: true })).toEqual(['a', 'b', 'c']);
    expect(Util.flatten({ a: { b: 'c' } })).toEqual({ 'a.b': 'c' });
    // expect(Util.flatten({ a: { b: 1, 'nested.attribute': 2 } }, { strict: true })).toEqual({ 'a.b': 1, "a.['nested.attribute']": 2 }); // Lodash.set
    expect(Util.flatten({ a: { b: 1, 'nested.attribute': 2 } }, { strict: true })).toEqual({ 'a.b': 1, 'a.nested\\.attribute': 2 }); // dot-prop setProperty
    expect(Util.flatten({ a: { b: 1, c: [4, 5, 6] } })).toEqual({ 'a.b': 1, 'a.c.0': 4, 'a.c.1': 5, 'a.c.2': 6 });
    expect(Util.flatten({ a: { b: 1, c: [4, 5, 6] } }, { safe: true })).toEqual({ 'a.b': 1, 'a.c': [4, 5, 6] });
  });

  test('unflatten', () => {
    const oid = new ObjectId();
    expect(Util.unflatten([])).toEqual([]);
    expect(Util.unflatten(oid)).toEqual(oid);
    expect(Util.unflatten(oid, { safe: true })).toEqual(oid);
    expect(Util.unflatten(['a', 'b', 'c'], { safe: true })).toEqual(['a', 'b', 'c']);
    expect(Util.unflatten({ 'a.b.c': 'd' })).toEqual({ a: { b: { c: 'd' } } });
    expect(Util.unflatten({ a: { b: { c: 'd' } } })).toEqual({ a: { b: { c: 'd' } } });
    expect(Util.unflatten({ role: { 'detail.scope': 'r' } })).toEqual({ role: { detail: { scope: 'r' } } });
    expect(Util.unflatten({
      role: {
        'detail.crud': 'c',
        'detail.scope': 'r',
        'detail.detail': {
          nested: { prop: 'prop' },
          'nested.attribute': 'attr',
        },
      },
    })).toEqual({
      role: {
        detail: {
          crud: 'c',
          scope: 'r',
          detail: {
            nested: { prop: 'prop', attribute: 'attr' },
          },
        },
      },
    });
  });

  test('preserve nested keys', () => {
    const obj = { a: { b: 1, 'nested.attribute': 2 } };
    expect(Util.unflatten(Util.flatten(obj, { strict: true }))).toEqual(obj);
  });

  test('depth 1', () => {
    const obj = { a: { b: { bb: 'bb' }, c: { cc: 'cc' } } };
    const flat = Util.flatten(obj, { depth: 1 });
    expect(flat).toEqual({ 'a.b': { bb: 'bb' }, 'a.c': { cc: 'cc' } });
    expect(Util.unflatten(flat)).toEqual(obj);
  });
});
