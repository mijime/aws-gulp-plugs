'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.default = deployCloudFormation;

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _through = require('through2');

var _awsSdk = require('aws-sdk');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function deployCloudFormation(params) {
  var cf = new Promisify(new _awsSdk.CloudFormation());

  return (0, _through.obj)(function transform(file, enc, done) {
    var _this = this;

    if (file.isNull()) {
      this.push(file);
      return done();
    }

    var StackName = _path2.default.basename(file.path, '.json');
    var TemplateBody = file.contents.toString(enc);

    return cf.node('describeStacks')({ StackName: StackName }).catch(function (err) {
      console.log(err);

      return cf.node('createStack')(_extends({
        StackName: StackName,
        TemplateBody: TemplateBody
      }, params)).then(function () {
        return cf.node('waitFor')('stackCreateComplete', { StackName: StackName });
      });
    }).then(function () {
      return cf.node('updateStack')(_extends({
        StackName: StackName,
        TemplateBody: TemplateBody
      }, params)).then(function () {
        return cf.node('waitFor')('stackUpdateComplete', { StackName: StackName });
      }).catch(function (err) {
        if (err.message === 'No updates are to be performed.') {
          return;
        }

        throw err;
      });
    }).then(function () {
      return cf.node('describeStacks')({ StackName: StackName });
    }).then(function (_ref) {
      var Stacks = _ref.Stacks;

      return Stacks.map(function (_ref2) {
        var Outputs = _ref2.Outputs;

        return Outputs.reduce(function (acc, _ref3) {
          var OutputKey = _ref3.OutputKey;
          var OutputValue = _ref3.OutputValue;

          acc[OutputKey] = OutputValue;
          return acc;
        }, {});
      }).reduce(function (_, latest) {
        return latest;
      });
    }).then(function (output) {
      file.contents = new Buffer(JSON.stringify(output, null, '  '));
      _this.push(file);
      return done();
    }).catch(function (err) {
      console.log(err);
      return done(err);
    });
  });
}

var Promisify = function () {
  function Promisify(context) {
    _classCallCheck(this, Promisify);

    this.context = context;
  }

  _createClass(Promisify, [{
    key: 'node',
    value: function node(func) {
      var _this2 = this;

      return function () {
        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }

        return new Promise(function (resolve, reject) {
          return _this2.context[func].apply(_this2.context, args.concat([function (err, res) {
            if (err) {
              return reject(err);
            }

            return resolve(res);
          }]));
        });
      };
    }
  }]);

  return Promisify;
}();

module.exports = exports['default'];