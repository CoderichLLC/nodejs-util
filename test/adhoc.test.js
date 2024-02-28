const Util = require('../src/index');

describe('Util.adhoc', () => {
  test('pairs', () => {
    expect(Util.pairs([])).toEqual([]);
    expect(Util.pairs(['a'])).toEqual([['a']]);
    expect(Util.pairs('a', 'b')).toEqual([['a', 'b']]);
    expect(Util.pairs('a', 'b', 'c')).toEqual([['a', 'b'], ['c']]);
  });

  test('ensureArray', () => {
    expect(Util.ensureArray(undefined)).toEqual([]);
    expect(Util.ensureArray(null)).toEqual([null]);
    expect(Util.ensureArray(false)).toEqual([false]);
  });
});
