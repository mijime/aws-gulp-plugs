'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = jsonMerge;

var _through = require('through2');

function jsonMerge() {
  var list = [];
  var tmpfile = null;

  return (0, _through.obj)(function transform(file, enc, done) {
    if (file.isNull()) {
      this.push(file);
      return done();
    }

    var data = JSON.parse(file.contents.toString(enc));
    list.push(data);
    tmpfile = file;
    return done();
  }, function flush(done) {
    if (!tmpfile) {
      return done();
    }

    var extendData = list.reduce(extend, {});
    tmpfile.contents = new Buffer(JSON.stringify(extendData, null, '  '));
    this.push(tmpfile);
    return done();
  });
}

function extend(acc, node) {
  if (node === null) {
    return acc;
  }

  if (acc instanceof Array && node instanceof Array) {
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