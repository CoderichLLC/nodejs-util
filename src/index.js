const ChildProcess = require('child_process');
const ObjectId = require('bson-objectid');
const set = require('lodash.set');

exports.uvl = (...values) => values.reduce((prev, value) => (prev === undefined ? value : prev), undefined);
exports.nvl = (...values) => values.reduce((prev, value) => (prev === null ? value : prev), null);
exports.push = (arr, it) => arr[arr.push(it) - 1];
exports.filterBy = (arr, fn) => arr.filter((b, index, self) => index === self.findIndex(a => fn(a, b)));
exports.ensureArray = a => (Array.isArray(a) ? a : [a].filter(el => el !== undefined));
exports.timeout = ms => new Promise((resolve) => { setTimeout(resolve, ms); });

exports.shellCommand = (cmd, ...args) => {
  const { status = 0, stdout = '', stderr = '' } = ChildProcess.spawnSync(cmd, args.flat(), { shell: true, encoding: 'utf8' });
  if (status !== 0) throw new Error(stderr);
  return (stderr || stdout).trim();
};

exports.flatten = (mixed, spread = true) => {
  return exports.map(mixed, el => (function flatten(data, obj = {}, path = []) {
    const type = Object.prototype.toString.call(data);
    const types = spread ? ['[object Object]', '[object Array]'] : ['[object Object]'];

    if (types.includes(type) && !ObjectId.isValid(data)) {
      return Object.entries(data).reduce((o, [key, value]) => {
        const $key = key.split('.').length > 1 ? `['${key}']` : key;
        return flatten(value, o, path.concat($key));
      }, obj);
    }

    if (path.length) {
      obj[path.join('.')] = data;
      return obj;
    }

    return data;
  }(el)));
};

exports.unflatten = (data, spread = true) => {
  return exports.map(data, (el) => {
    const type = Object.prototype.toString.call(data);
    const types = spread ? ['[object Object]', '[object Array]'] : ['[object Object]'];
    return types.includes(type) ? Object.entries(el).reduce((prev, [key, value]) => {
      return set(prev, key, value);
    }, {}) : el;
  });
};

exports.map = (mixed, fn) => {
  if (mixed == null) return mixed;
  const isArray = Array.isArray(mixed);
  const arr = isArray ? mixed : [mixed];
  const results = arr.map((...args) => fn(...args));
  return isArray ? results : results[0];
};

exports.mapPromise = (mixed, fn) => {
  const map = exports.map(mixed, fn);
  return Array.isArray(map) ? Promise.all(map) : Promise.resolve(map);
};

exports.promiseChain = (thunks) => {
  return thunks.reduce((promise, thunk) => {
    return promise.then((values) => {
      return Promise.resolve(thunk(values)).then((result) => {
        return [...values, result];
      });
    });
  }, Promise.resolve([]));
};

exports.pipeline = (thunks, startValue) => {
  let $value = startValue;

  return thunks.reduce((promise, thunk) => {
    return promise.then((value) => {
      if (value !== undefined) $value = value;
      return Promise.resolve(thunk($value));
    });
  }, Promise.resolve(startValue));
};
