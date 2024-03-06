const FS = require('fs');
const Path = require('path');
const ChildProcess = require('child_process');
const ObjectId = require('bson-objectid');
const isEqual = require('lodash.isequal');
const { set } = require('dot-prop');

exports.set = set;
exports.isEqual = isEqual;
exports.ObjectId = ObjectId;

exports.push = (arr, el) => arr[arr.push(el) - 1];
exports.uvl = (...values) => values.reduce((prev, value) => (prev === undefined ? value : prev), undefined);
exports.nvl = (...values) => values.reduce((prev, value) => (prev === null ? value : prev), null);
exports.pairs = (...values) => values.flat().reduce((prev, curr, i, arr) => (i % 2 === 0 ? prev.concat([arr.slice(i, i + 2)]) : prev), []);
exports.filterBy = (arr, fn) => arr.filter((b, index) => index === arr.findIndex(a => fn(a, b)));
exports.ensureArray = a => (Array.isArray(a) ? a : [a].filter(el => el !== undefined));
exports.timeout = ms => new Promise((resolve) => { setTimeout(resolve, ms); });
exports.ucFirst = string => string.charAt(0).toUpperCase() + string.slice(1);
exports.isScalarValue = value => value !== Object(value);
exports.isPlainObjectOrArray = obj => Array.isArray(obj) || exports.isPlainObject(obj);

exports.findAndReplace = (arr, fn, ...items) => {
  return arr.find((el, i, ...rest) => {
    const res = fn(el, i, ...rest);
    if (res) arr.splice(i, 1, ...items);
    return res;
  });
};

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
        const $key = options.strict ? key.replaceAll('.', '\\.') : key;
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
      return exports.set(prev, key, value);
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

exports.pathmap = (paths, mixed, fn = v => v) => {
  if (!exports.isPlainObjectOrArray(mixed)) return mixed;
  if (typeof paths === 'string') paths = paths.split('.');
  paths = paths.filter(Boolean);

  const traverse = (keys, parent, path = [], jsonpath = []) => {
    if (exports.isPlainObjectOrArray(parent)) {
      const key = keys.shift();
      const isProperty = Object.prototype.hasOwnProperty.call(parent, key);

      // When there are more keys to go; the best we can do is traverse what's there
      // Otherwise, when at the last key, we can callback and assign response value
      if (keys.length) {
        if (isProperty) {
          traverse(keys, parent[key], path.concat(key), jsonpath.concat(key));
        } else if (Array.isArray(parent)) {
          jsonpath.push('[*]');
          parent.forEach((el, i) => traverse([key, ...keys], el, path.concat(i), jsonpath));
        }
      } else if (Array.isArray(parent)) {
        jsonpath.push('[*]');
        parent.forEach((el, i) => (el[key] = fn(el[key], { key, parent: el, path: path.concat(i, key), jsonpath: jsonpath.concat(key) })));
      } else {
        parent[key] = fn(parent[key], { key, parent, path: path.concat(key), jsonpath: jsonpath.concat(key) });
      }
    }
  };

  if (paths.length) {
    traverse(paths, mixed);
  } else {
    mixed = fn(mixed, { key: '', parent: mixed, path: [], jsonpath: [] });
  }

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
