const Util = require('../src/index');

describe('Util.transforms', () => {
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

  test('pathmap', () => {
    expect(Util.pathmap('')).toBeUndefined();
    expect(Util.pathmap('', null)).toBeNull();
    expect(Util.pathmap('', false)).toBe(false);
    expect(Util.pathmap('a.b.c', { name: 'rich' })).toEqual({ name: 'rich' });
    expect(Util.pathmap('name', { name: 'a' }, v => `${v}${v}`)).toEqual({ name: 'aa' });
    expect(Util.pathmap('arr', [{ arr: ['a', 'b'] }, { arr: ['c', 'd'] }], v => `${v}${v}`)).toEqual([{ arr: ['aa', 'bb'] }, { arr: ['cc', 'dd'] }]);
    expect(Util.pathmap('edges.1.name', { edges: [{ name: 'a' }, { name: 'b' }] }, v => `${v}${v}`)).toEqual({ edges: [{ name: 'a' }, { name: 'bb' }] });
    expect(Util.pathmap('edges.2.name', { edges: [{ name: 'a' }, { name: 'b' }] }, v => `${v}${v}`)).toEqual({ edges: [{ name: 'a' }, { name: 'b' }] });
    expect(Util.pathmap('edges.arr', { edges: [{ arr: ['a', 'b', 'c'] }, { arr: ['d', 'e', 'f'] }] }, v => `${v}${v}`)).toEqual({ edges: [{ arr: ['aa', 'bb', 'cc'] }, { arr: ['dd', 'ee', 'ff'] }] });
    expect(Util.pathmap('edges.arr', [{ edges: [{ arr: ['a', 'b', 'c'] }, { arr: ['d', 'e', 'f'] }] }], v => `${v}${v}`)).toEqual([{ edges: [{ arr: ['aa', 'bb', 'cc'] }, { arr: ['dd', 'ee', 'ff'] }] }]);

    expect(Util.pathmap('edges.node.name', {
      edges: [
        { node: { name: 'a' } },
        { node: { name: 'b' } },
        { node: { name: 'c' } },
      ],
    }, v => `${v}${v}`)).toEqual({
      edges: [
        { node: { name: 'aa' } },
        { node: { name: 'bb' } },
        { node: { name: 'cc' } },
      ],
    });

    expect(Util.pathmap('edges.node.item.name', {
      edges: [
        { node: { item: [{ id: 1, name: 'a' }, { id: 2, name: 'b' }, { id: 3, name: 'c' }] } },
        { node: { item: [{ id: 1, name: 'a' }, { id: 2, name: 'b' }, { id: 3, name: 'c' }] } },
        { node: { item: [{ id: 1, name: 'a' }, { id: 2, name: 'b' }, { id: 3, name: 'c' }] } },
      ],
    }, v => `${v}${v}`)).toEqual({
      edges: [
        { node: { item: [{ id: 1, name: 'aa' }, { id: 2, name: 'bb' }, { id: 3, name: 'cc' }] } },
        { node: { item: [{ id: 1, name: 'aa' }, { id: 2, name: 'bb' }, { id: 3, name: 'cc' }] } },
        { node: { item: [{ id: 1, name: 'aa' }, { id: 2, name: 'bb' }, { id: 3, name: 'cc' }] } },
      ],
    });
  });
});