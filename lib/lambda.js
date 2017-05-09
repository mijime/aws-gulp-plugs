'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = updateFunctionCode;
exports.createLambdaZip = createLambdaZip;
exports.tapBrowserifyForNode = tapBrowserifyForNode;

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _through = require('through2');

var _awsSdk = require('aws-sdk');

var _yazl = require('yazl');

var _concatStream = require('concat-stream');

var _concatStream2 = _interopRequireDefault(_concatStream);

var _browserify = require('browserify');

var _browserify2 = _interopRequireDefault(_browserify);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function updateFunctionCode() {
  for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }

  var lambda = new (Function.prototype.bind.apply(_awsSdk.Lambda, [null].concat(args)))();

  function transform(file, _, done) {
    var _this = this;

    if (file.isNull()) {
      return done();
    }

    var FunctionName = _path2.default.basename(file.path, '.js');
    lambda.updateFunctionCode({
      FunctionName: FunctionName,
      ZipFile: file.contents
    }, function (err) {
      if (err) {
        done(err);
        return;
      }

      _this.push(file);
      return done();
    });
  }

  return (0, _through.obj)(transform);
}

function createLambdaZip() {
  function transform(file, _, done) {
    var _this2 = this;

    if (file.isNull()) {
      return done();
    }

    var zip = new _yazl.ZipFile();
    var filename = 'index.js';
    var stat = {
      compress: true,
      mtime: file.stat ? file.stat.mtime : new Date(),
      mode: file.stat ? file.stat.mode : null
    };
    var filepath = _path2.default.join(_path2.default.dirname(file.path), _path2.default.basename(file.path, '.js') + '.zip');

    if (file.isStream()) {
      zip.addReadStream(file.contents, filename, stat);
    }
    if (file.isBuffer()) {
      zip.addBuffer(file.contents, filename, stat);
    }

    zip.end(function () {
      zip.outputStream.pipe((0, _concatStream2.default)(function (data) {
        file.path = filepath;
        file.contents = data;
        _this2.push(file);
        return done();
      }));
    });
  }

  return (0, _through.obj)(transform);
}

function tapBrowserifyForNode() {
  var bundle = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : function (b) {
    return b;
  };

  function transform(file, enc, done) {
    if (file.isNull()) {
      return done();
    }

    var bundler = (0, _browserify2.default)(file.path, {
      detectGlobals: false,
      builtins: false,
      commondir: false,
      browserField: false,
      standalone: 'code'
    });

    file.contents = bundle(bundler).bundle();
    this.push(file);
    return done();
  }

  return (0, _through.obj)(transform);
}