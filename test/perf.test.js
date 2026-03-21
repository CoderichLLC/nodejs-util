const Crypto = require('node:crypto');
const Flat = require('flat');
const { flatten, unflatten } = require('../src');

describe('performance', () => {
  let largeObj;

  beforeAll(() => {
    let depth = 0;
    const iterator = Array.from(new Array(100));
    const reducer = obj => iterator.reduce((prev) => {
      return Object.assign(prev, iterator.reduce(p => Object.assign(p, {
        [Crypto.randomBytes(16).toString('hex')]: ++depth > 10 ? Crypto.randomBytes(16).toString('hex') : reducer({}),
      }), {}));
    }, obj);
    largeObj = reducer({});
  });

  test('flatten/unflatten', () => {
    console.time('Flat.flatten');
    const flat = Flat.flatten(largeObj);
    console.timeEnd('Flat.flatten');

    console.time('Flat.unflatten');
    const unflat = Flat.unflatten(flat);
    console.timeEnd('Flat.unflatten');

    console.time('flatten');
    const fl = flatten(largeObj);
    console.timeEnd('flatten');

    console.time('unflatten');
    const unfl = unflatten(fl);
    console.timeEnd('unflatten');

    expect(fl).toEqual(flat);
    expect(unfl).toEqual(largeObj);
  });
});
