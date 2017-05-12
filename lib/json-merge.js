'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = jsonMerge;

var _through = require('through2');

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
    tmpfile.contents = Buffer.from(JSON.stringify(extendData, null, '  '));
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
    return Object.keys(node).reduce(function (a, key) {
      a[key] = extend(a[key], node[key]);
      return a;
    }, acc);
  }

  return node;
}
module.exports = exports['default'];