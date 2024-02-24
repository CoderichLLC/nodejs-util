const FS = require('fs');
const Path = require('path');
const ChildProcess = require('child_process');
const ObjectId = require('bson-objectid');
const set = require('lodash.set');
const isEqual = require('lodash.isequal');

exports.set = set;
exports.isEqual = isEqual;
exports.ObjectId = ObjectId;

exports.push = (arr, it) => arr[arr.push(it) - 1];
exports.uvl = (...values) => values.reduce((prev, value) => (prev === undefined ? value : prev), undefined);
exports.nvl = (...values) => values.reduce((prev, value) => (prev === null ? value : prev), null);
exports.filterBy = (arr, fn) => arr.filter((b, index) => index === arr.findIndex(a => fn(a, b)));
exports.ensureArray = a => (Array.isArray(a) ? a : [a].filter(el => el !== undefined));
exports.timeout = ms => new Promise((resolve) => { setTimeout(resolve, ms); });
exports.ucFirst = string => string.charAt(0).toUpperCase() + string.slice(1);
exports.isScalarValue = value => value !== Object(value);
exports.isPlainObjectOrArray = obj => Array.isArray(obj) || exports.isPlainObject(obj);

exports.isPlainObject = (obj) => {
  if (obj == null || Array.isArray(obj)) return false;
  const proto = Object.getPrototypeOf(obj);
  return proto === Object.prototype || proto?.toString?.call?.(obj) === '[object Object]';
};

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
  const typeFn = options.safe ? exports.isPlainObject : exports.isPlainObjectOrArray;

  return exports.map(mixed, el => (function flatten(data, obj = {}, path = [], depth = 0) {
    if (depth <= maxDepth && typeFn(data) && Object.keys(data).length) {
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
  const typeFn = options.safe ? exports.isPlainObject : exports.isPlainObjectOrArray;

  return exports.map(data, (el) => {
    return typeFn(data) ? Object.entries(el).reduce((prev, [key, value]) => {
      return set(prev, key, value);
    }, {}) : el;
  });
};

exports.changeset = (lhs, rhs) => {
  lhs = lhs ?? {}; rhs = rhs ?? {};
  const [$lhs, $rhs] = [exports.flatten(lhs), exports.flatten(rhs)];
  const changeset = { added: {}, updated: {}, deleted: {} };

  // Updated + Deleted
  Object.entries($lhs).forEach(([key, value]) => {
    if (Object.prototype.hasOwnProperty.call($rhs, key)) {
      const $value = $rhs[key];
      if (!exports.isEqual(value, $value)) changeset.updated[key] = $value;
      delete $rhs[key];
    } else {
      changeset.deleted[key] = value;
    }
  });

  // Added
  changeset.added = $rhs;
  return changeset;
};

exports.map = (mixed, fn) => {
  if (mixed == null) return mixed;
  const isArray = Array.isArray(mixed);
  const arr = isArray ? mixed : [mixed];
  const results = arr.map((...args) => fn(...args));
  return isArray ? results : results[0];
};

exports.pathmap = (paths, mixed, fn) => {
  if (!exports.isPlainObjectOrArray(mixed)) return mixed;
  if (typeof paths === 'string') paths = paths.split('.');

  const traverse = (keys, parent) => {
    if (exports.isPlainObjectOrArray(parent)) {
      const key = keys.shift();
      const isProperty = Object.prototype.hasOwnProperty.call(parent, key);

      if (keys.length) {
        if (isProperty) traverse(keys, parent[key]);
        else if (Array.isArray(parent)) parent.forEach(el => traverse([key, ...keys], el));
      } else if (isProperty) {
        parent[key] = fn(parent[key]);
      } else if (Array.isArray(parent)) {
        parent.forEach(el => (el[key] = exports.map(el[key], v => fn(v))));
      }
    }
  };

  traverse(paths, mixed);
  return mixed;
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
      return Promise.resolve(thunk($value)).then((result = $value) => result);
    });
  }, Promise.resolve(startValue));
};

exports.requireDir = (dir) => {
  const data = {};
  dir = Path.resolve(dir);

  FS.readdirSync(dir).forEach((filename) => {
    const { name } = Path.parse(filename);
    const path = `${dir}/${filename}`;
    const stat = FS.statSync(path);

    if (stat && stat.isDirectory()) {
      data[name] = exports.requireDir(path);
    } else if (path.includes('.js')) {
      data[name] = require(path); // eslint-disable-line import/no-dynamic-require, global-require
    }
  });

  return data;
};
