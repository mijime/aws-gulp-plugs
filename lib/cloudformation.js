'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.default = deployCloudFormation;
exports.convertParameters = convertParameters;

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _through = require('through2');

var _awsSdk = require('aws-sdk');

var _utils = require('./utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function deployCloudFormation(params) {
  var cf = new _utils.Promisify(new _awsSdk.CloudFormation());

  return (0, _through.obj)(function transform(file, enc, done) {
    var _this = this;

    if (file.isNull()) {
      this.push(file);
      return done();
    }

    var StackName = _path2.default.basename(file.path, '.json');
    var TemplateBody = file.contents.toString(enc);

    return cf.node('describeStacks')({ StackName: StackName }).catch(function () {
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

function convertParameters() {
  return (0, _through.obj)(function transform(file, enc, done) {
    if (file.isNull()) {
      this.push(file);
      return done();
    }

    var contents = JSON.parse(file.contents.toString(enc));
    file.contents = new Buffer(JSON.stringify(Object.keys(contents).reduce(function (acc, key) {
      acc.Parameters[key] = { Type: 'String', Default: contents[key] };
      return acc;
    }, { Parameters: {} })));
    this.push(file);
    return done();
  });
}