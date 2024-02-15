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
    expect(Util.flatten({ arr: [] })).toEqual({ arr: [] });
    expect(Util.flatten({})).toEqual({});
    expect(Util.flatten({ obj: {} })).toEqual({ obj: {} });
    expect(Util.flatten(['a', 'b', 'c'])).toEqual(['a', 'b', 'c']);
    expect(Util.flatten(['a', 'b', 'c'], { safe: true })).toEqual(['a', 'b', 'c']);
    expect(Util.flatten({ a: { b: 'c' } })).toEqual({ 'a.b': 'c' });
    expect(Util.flatten({ a: { b: 1, 'nested.attribute': 2 } }, { strict: true })).toEqual({ 'a.b': 1, "a.['nested.attribute']": 2 });
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
  });

  test.skip('changeset', () => {
    const lhs = {
      id: new ObjectId('650f8a03a208dd188bc910c2'),
      name: 'lhs',
      sections: [{ id: 1, name: 'section1' }, { id: 2, name: 'section2' }, { id: 3, name: 'section3' }],
      array: ['a', 'b', 'c'],
    };

    // Empty rhs means everything was deleted
    expect(Util.changeset(lhs)).toEqual({ added: {}, updated: {}, deleted: Util.flatten(lhs) });
    expect(Util.changeset(lhs, {})).toEqual({ added: {}, updated: {}, deleted: Util.flatten(lhs) });
    expect(Util.changeset(lhs, undefined)).toEqual({ added: {}, updated: {}, deleted: Util.flatten(lhs) });

    const rhs = {
      id: new ObjectId('650f8a03a208dd188bc910c2'),
      name: 'rhs',
      frozen: 'rope',
      sections: [{ id: 1, name: 'section1', frozen: 'rope' }, { id: 3, name: 'section3' }, { id: 4, name: 'section4' }],
      array: ['a', 'c'],
    };

    // Dumb Array of Objects...
    expect(Util.changeset(lhs, rhs)).toEqual({
      added: {
        frozen: 'rope',
        'sections.0.frozen': 'rope',
      },
      updated: {
        name: 'rhs',
        'sections.1.id': 3,
        'sections.1.name': 'section3',
        'sections.2.id': 4,
        'sections.2.name': 'section4',
        'array.1': 'c',
      },
      deleted: {
        'array.2': 'c',
      },
    });

    // What I want
    expect(Util.changeset(lhs, rhs)).toEqual({
      added: {
        frozen: 'rope',
        'sections.0.frozen': 'rope',
        'sections.2.id': 4,
        'sections.2.name': 'section4',
      },
      updated: {
        name: 'rhs',
        'array.1': 'c',
      },
      deleted: {
        'array.2': 'c',
        'sections.2.id': 3,
        'sections.2.name': 'section3',
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

    expect(await Util.pipeline([
      () => 30,
      value => Util.timeout(300).then(() => value * 10),
      value => Util.timeout(100).then(() => value + 3),
      () => undefined,
    ])).toEqual(303);
  });

  test('isPlainObject', () => {
    const obj = {};
    expect(Util.isPlainObject({})).toBe(true);
    expect(Util.isPlainObject(obj)).toBe(true);
    expect(Util.isPlainObject(Object.create(obj))).toBe(true);
    expect(Util.isPlainObject(null)).toBe(false);
    expect(Util.isPlainObject(undefined)).toBe(false);
    expect(Util.isPlainObject(new Date())).toBe(false);
    expect(Util.isPlainObject(new ObjectId())).toBe(false);
    expect(Util.isPlainObject([])).toBe(false);
    expect(Util.isPlainObject([obj])).toBe(false);
  });
});
