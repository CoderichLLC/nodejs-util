const ObjectId = require('bson-objectid');
const Util = require('../src/index');

describe('Util.isDataType', () => {
  test('data types', () => {
    const obj = {};
    expect(Util.isScalarValue({})).toBe(false);
    expect(Util.isPlainObject({})).toBe(true);
    expect(Util.isPlainObjectOrArray({})).toBe(true);

    expect(Util.isScalarValue(obj)).toBe(false);
    expect(Util.isPlainObject(obj)).toBe(true);
    expect(Util.isPlainObjectOrArray(obj)).toBe(true);

    expect(Util.isScalarValue(Object.create(obj))).toBe(false);
    expect(Util.isPlainObject(Object.create(obj))).toBe(true);
    expect(Util.isPlainObjectOrArray(Object.create(obj))).toBe(true);

    expect(Util.isScalarValue(new Date())).toBe(false);
    expect(Util.isPlainObject(new Date())).toBe(false);
    expect(Util.isPlainObjectOrArray(new Date())).toBe(false);

    expect(Util.isScalarValue(new ObjectId())).toBe(false);
    expect(Util.isPlainObject(new ObjectId())).toBe(false);
    expect(Util.isPlainObjectOrArray(new ObjectId())).toBe(false);

    expect(Util.isScalarValue([])).toBe(false);
    expect(Util.isPlainObject([])).toBe(false);
    expect(Util.isPlainObjectOrArray([])).toBe(true);

    expect(Util.isScalarValue([obj])).toBe(false);
    expect(Util.isPlainObject([obj])).toBe(false);
    expect(Util.isPlainObjectOrArray([obj])).toBe(true);

    expect(Util.isScalarValue(new Promise(() => {}))).toBe(false);
    expect(Util.isPlainObject(new Promise(() => {}))).toBe(false);
    expect(Util.isPlainObjectOrArray(new Promise(() => {}))).toBe(false);

    expect(Util.isScalarValue(() => null)).toBe(false);
    expect(Util.isPlainObject(() => null)).toBe(false);
    expect(Util.isPlainObjectOrArray(() => null)).toBe(false);

    expect(Util.isScalarValue(null)).toBe(true);
    expect(Util.isPlainObject(null)).toBe(false);
    expect(Util.isPlainObjectOrArray(null)).toBe(false);

    expect(Util.isScalarValue(undefined)).toBe(true);
    expect(Util.isPlainObject(undefined)).toBe(false);
    expect(Util.isPlainObjectOrArray(undefined)).toBe(false);

    expect(Util.isScalarValue(true)).toBe(true);
    expect(Util.isPlainObject(true)).toBe(false);
    expect(Util.isPlainObjectOrArray(true)).toBe(false);

    expect(Util.isScalarValue(false)).toBe(true);
    expect(Util.isPlainObject(false)).toBe(false);
    expect(Util.isPlainObjectOrArray(false)).toBe(false);

    expect(Util.isScalarValue(0)).toBe(true);
    expect(Util.isPlainObject(0)).toBe(false);
    expect(Util.isPlainObjectOrArray(0)).toBe(false);

    expect(Util.isScalarValue('hello world')).toBe(true);
    expect(Util.isPlainObject('hello world')).toBe(false);
    expect(Util.isPlainObjectOrArray('hello world')).toBe(false);

    expect(Util.isScalarValue({ role: { 'detail.scope': 'r' } })).toBe(false);
    expect(Util.isPlainObject({ role: { 'detail.scope': 'r' } })).toBe(true);
    expect(Util.isPlainObjectOrArray({ role: { 'detail.scope': 'r' } })).toBe(true);
  });
});
