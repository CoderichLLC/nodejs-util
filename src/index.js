const ChildProcess = require('child_process');
const set = require('lodash.set');

exports.shellCommand = (cmd, ...args) => {
  const { status = 0, stdout = '', stderr = '' } = ChildProcess.spawnSync(cmd, args.flat(), { shell: true, encoding: 'utf8' });
  if (status !== 0) throw new Error(stderr);
  return (stderr || stdout).trim();
};

exports.flatten = (mixed) => {
  return exports.map(mixed, el => (function flatten(data, obj = {}, path = []) {
    if (['[object Object]', '[object Array]'].includes(Object.prototype.toString.call(data))) {
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
  }(mixed)));
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
