'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var deployCloudFormation = function () {
  var _ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee(params) {
    var StackName, _ref2, Stacks;

    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            StackName = params.StackName;
            _context.prev = 1;
            _context.next = 4;
            return cf.describeStacks({
              StackName: StackName
            }).promise();

          case 4:
            _context.next = 6;
            return cf.updateStack(params).promise();

          case 6:
            _context.next = 12;
            break;

          case 8:
            _context.prev = 8;
            _context.t0 = _context['catch'](1);
            _context.next = 12;
            return cf.createStack(params).promise();

          case 12:
            _context.next = 14;
            return cf.waitFor('stackCreateComplete', {
              StackName: StackName
            }).promise();

          case 14:
            _context.next = 16;
            return cf.describeStacks({
              StackName: StackName
            }).promise();

          case 16:
            _ref2 = _context.sent;
            Stacks = _ref2.Stacks;
            return _context.abrupt('return', Stacks.map(function (_ref3) {
              var Outputs = _ref3.Outputs;

              return Outputs.reduce(function (acc, _ref4) {
                var OutputKey = _ref4.OutputKey,
                    OutputValue = _ref4.OutputValue;

                acc[OutputKey] = OutputValue;
                return acc;
              }, {});
            }).reduce(function (_, latest) {
              return latest;
            }));

          case 19:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this, [[1, 8]]);
  }));

  return function deployCloudFormation(_x) {
    return _ref.apply(this, arguments);
  };
}();

exports.deployFromParameters = deployFromParameters;
exports.default = deployFromTemplates;
exports.convertParameters = convertParameters;

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _through = require('through2');

var _awsSdk = require('aws-sdk');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var cf = new _awsSdk.CloudFormation();

function deployFromParameters(params) {
  var transform = function () {
    var _ref5 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee2(file, enc, done) {
      var Parameters, contents;
      return _regenerator2.default.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              if (!file.isNull()) {
                _context2.next = 4;
                break;
              }

              this.push(file);
              done();
              return _context2.abrupt('return');

            case 4:
              Parameters = JSON.parse(file.contents.toString(enc));
              _context2.prev = 5;
              _context2.next = 8;
              return deployCloudFormation((0, _extends3.default)({
                Parameters: Parameters
              }, params));

            case 8:
              contents = _context2.sent;


              file.contents = Buffer.from((0, _stringify2.default)(contents, null, '  '));
              this.push(file);
              done();
              return _context2.abrupt('return');

            case 15:
              _context2.prev = 15;
              _context2.t0 = _context2['catch'](5);

              done(_context2.t0);

            case 18:
            case 'end':
              return _context2.stop();
          }
        }
      }, _callee2, this, [[5, 15]]);
    }));

    return function transform(_x2, _x3, _x4) {
      return _ref5.apply(this, arguments);
    };
  }();

  return (0, _through.obj)(transform);
}

function deployFromTemplates(params) {
  var transform = function () {
    var _ref6 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee3(file, enc, done) {
      var StackName, TemplateBody, contents;
      return _regenerator2.default.wrap(function _callee3$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              if (!file.isNull()) {
                _context3.next = 3;
                break;
              }

              this.push(file);
              return _context3.abrupt('return', done());

            case 3:
              StackName = _path2.default.basename(file.path, '.json');
              TemplateBody = file.contents.toString(enc);
              _context3.prev = 5;
              _context3.next = 8;
              return deployCloudFormation((0, _extends3.default)({
                StackName: StackName,
                TemplateBody: TemplateBody
              }, params));

            case 8:
              contents = _context3.sent;


              file.contents = Buffer.from((0, _stringify2.default)(contents, null, '  '));
              this.push(file);
              done();
              return _context3.abrupt('return');

            case 15:
              _context3.prev = 15;
              _context3.t0 = _context3['catch'](5);

              done(_context3.t0);

            case 18:
            case 'end':
              return _context3.stop();
          }
        }
      }, _callee3, this, [[5, 15]]);
    }));

    return function transform(_x5, _x6, _x7) {
      return _ref6.apply(this, arguments);
    };
  }();

  return (0, _through.obj)(transform);
}

function convertParameters() {
  function transform(file, enc, done) {
    if (file.isNull()) {
      this.push(file);
      return done();
    }

    var contents = JSON.parse(file.contents.toString(enc));
    file.contents = Buffer.from((0, _stringify2.default)((0, _keys2.default)(contents).reduce(function (acc, key) {
      acc.Parameters[key] = { Type: 'String', Default: contents[key] };
      return acc;
    }, { Parameters: {} })));
    this.push(file);
    return done();
  }

  return (0, _through.obj)(transform);
}