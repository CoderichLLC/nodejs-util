const ChildProcess = require('child_process');
const ObjectId = require('bson-objectid');
const set = require('lodash.set');

exports.uvl = (...values) => values.reduce((prev, value) => (prev === undefined ? value : prev), undefined);
exports.nvl = (...values) => values.reduce((prev, value) => (prev === null ? value : prev), null);
exports.push = (arr, it) => arr[arr.push(it) - 1];
exports.filterBy = (arr, fn) => arr.filter((b, index) => index === arr.findIndex(a => fn(a, b)));
exports.ensureArray = a => (Array.isArray(a) ? a : [a].filter(el => el !== undefined));
exports.timeout = ms => new Promise((resolve) => { setTimeout(resolve, ms); });

exports.filterRe = (arr, fn) => {
  const map = new Map();
  const $arr = arr.map(el => fn(el));
  return arr.filter((el, i) => {
    const re = $arr[i];
    if (!map.has(re.source)) map.set(re.source, $arr.findIndex(({ source }) => source.match(re)));
    return map.get(re.source) === i;
  });
};

exports.shellCommand = (cmd, ...args) => {
  const { status = 0, stdout = '', stderr = '' } = ChildProcess.spawnSync(cmd, args.flat(), { shell: true, encoding: 'utf8' });
  if (status !== 0) throw new Error(stderr);
  return (stderr || stdout).trim();
};

exports.flatten = (mixed, options = {}) => {
  const maxDepth = options.depth ?? Infinity;

  return exports.map(mixed, el => (function flatten(data, obj = {}, path = [], depth = 0) {
    const type = Object.prototype.toString.call(data);
    const types = options.safe ? ['[object Object]'] : ['[object Object]', '[object Array]'];

    if (depth <= maxDepth && types.includes(type) && !ObjectId.isValid(data)) {
      return Object.entries(data).reduce((o, [key, value]) => {
        const $key = options.strict && key.split('.').length > 1 ? `['${key}']` : key;
        return flatten(value, o, path.concat($key), depth + 1);
      }, obj);
    }

    if (path.length) {
      obj[path.join('.')] = data;
      return obj;
    }

    return data;
  }(el)));
};

exports.unflatten = (data, options = {}) => {
  return exports.map(data, (el) => {
    const type = Object.prototype.toString.call(data);
    const types = options.safe ? ['[object Object]'] : ['[object Object]', '[object Array]'];
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
  if (thunks == null) return Promise.resolve([]);

  return thunks.reduce((promise, thunk) => {
    return promise.then((values) => {
      return Promise.resolve(thunk(values)).then((result) => {
        return [...values, result];
      });
    });
  }, Promise.resolve([]));
};

exports.promiseRetry = (fn, ms, retries = 5, cond = e => e) => {
  return fn().catch((e) => {
    if (!retries || !cond(e)) throw e;
    return exports.timeout(ms).then(() => exports.promiseRetry(fn, ms, --retries, cond));
  });
};

exports.pipeline = (thunks, startValue) => {
  let $value = startValue;
  if (thunks == null) return Promise.resolve($value);

  return thunks.reduce((promise, thunk) => {
    return promise.then((value) => {
      if (value !== undefined) $value = value;
      return Promise.resolve(thunk($value));
    });
  }, Promise.resolve(startValue));
};
