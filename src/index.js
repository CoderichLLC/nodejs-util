const ChildProcess = require('child_process');
const ObjectId = require('bson-objectid');
const set = require('lodash.set');

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

exports.unflatten = (data) => {
  return exports.map(data, (el) => {
    return typeof data === 'object' ? Object.entries(el).reduce((prev, [key, value]) => {
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

exports.promiseChain = (promiseThunks) => {
  return promiseThunks.reduce((chain, promiseThunk) => {
    return chain.then((chainResult) => {
      return promiseThunk(chainResult).then((promiseResult) => {
        return [...chainResult, promiseResult];
      });
    });
  }, Promise.resolve([]));
};
