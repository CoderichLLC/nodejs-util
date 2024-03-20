const Util = require('../src/index');

describe('Util.adhoc', () => {
  test('nvl', () => {
    expect(Util.nvl(undefined)).toBeUndefined();
  });

  test('uvl', () => {
    expect(Util.uvl(undefined)).toBeUndefined();
    expect(Util.uvl(undefined, [])).toEqual([]);
  });

  test('pairs', () => {
    expect(Util.pairs([])).toEqual([]);
    expect(Util.pairs(['a'])).toEqual([['a']]);
    expect(Util.pairs('a', 'b')).toEqual([['a', 'b']]);
    expect(Util.pairs('a', 'b', 'c')).toEqual([['a', 'b'], ['c']]);
    expect(Util.pairs('a', 'b', 'c', 'd')).toEqual([['a', 'b'], ['c', 'd']]);
    expect(Util.pairs(['a', 'b', 'c', 'd'])).toEqual([['a', 'b'], ['c', 'd']]);
  });

  test('ensureArray', () => {
    expect(Util.ensureArray(undefined)).toEqual([]);
    expect(Util.ensureArray(null)).toEqual([null]);
    expect(Util.ensureArray(false)).toEqual([false]);
  });
});
