'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

exports.default = jsonMerge;

var _through = require('through2');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function jsonMerge() {
  var list = [];
  var tmpfile = null;

  function transform(file, enc, done) {
    if (file.isNull()) {
      this.push(file);
      return done();
    }

    var data = JSON.parse(file.contents.toString(enc));
    list.push(data);
    tmpfile = file;
    return done();
  }

  function flush(done) {
    if (!tmpfile) {
      return done();
    }

    var extendData = list.reduce(extend, {});
    tmpfile.contents = Buffer.from((0, _stringify2.default)(extendData, null, '  '));
    this.push(tmpfile);
    return done();
  }

  return (0, _through.obj)(transform, flush);
}

function extend(acc, node) {
  if (node === null) {
    return acc;
  }

  if (Array.isArray(acc) && Array.isArray(node)) {
    return acc.concat(node);
  }

  if (acc instanceof Object && node instanceof Object) {
    return (0, _keys2.default)(node).reduce(function (a, key) {
      a[key] = extend(a[key], node[key]);
      return a;
    }, acc);
  }

  return node;
}
module.exports = exports['default'];