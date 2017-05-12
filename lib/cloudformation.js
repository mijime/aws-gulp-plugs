'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.deployFromParameters = deployFromParameters;
exports.deployFromTemplates = deployFromTemplates;
exports.convertParameters = convertParameters;

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _through = require('through2');

var _awsSdk = require('aws-sdk');

var _gulpUtil = require('gulp-util');

var _gulpUtil2 = _interopRequireDefault(_gulpUtil);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var cf = new _awsSdk.CloudFormation();

function deployCloudFormation(params) {
  var StackName = params.StackName;


  return cf.describeStacks({
    StackName: StackName
  }).promise().catch(function () {
    return cf.createStack(params).promise().then(function () {
      return cf.waitFor('stackCreateComplete', {
        StackName: StackName
      }).promise();
    });
  }).then(function () {
    return cf.updateStack(params).promise().catch(function (err) {
      if (err.code === 'ValidationError') {
        _gulpUtil2.default.log(err.message);
        return;
      }

      throw err;
    }).then(function () {
      return cf.waitFor('stackUpdateComplete', {
        StackName: StackName
      }).promise();
    });
  }).then(function () {
    return cf.describeStacks({
      StackName: StackName
    }).promise();
  }).then(function (_ref) {
    var Stacks = _ref.Stacks;
    return Stacks.map(function (_ref2) {
      var Outputs = _ref2.Outputs;

      return Outputs.reduce(function (acc, _ref3) {
        var OutputKey = _ref3.OutputKey,
            OutputValue = _ref3.OutputValue;

        acc[OutputKey] = OutputValue;
        return acc;
      }, {});
    }).reduce(function (_, latest) {
      return latest;
    });
  });
}

function deployFromParameters(params) {
  function transform(file, enc, done) {
    var _this = this;

    if (file.isNull()) {
      this.push(file);
      done();
      return;
    }

    var ParameterObjects = JSON.parse(file.contents.toString(enc));

    var Parameters = Object.keys(ParameterObjects).map(function (ParameterKey) {
      return {
        ParameterKey: ParameterKey,
        ParameterValue: ParameterObjects[ParameterKey]
      };
    });

    deployCloudFormation(_extends({
      Parameters: Parameters
    }, params)).then(function (contents) {
      file.contents = Buffer.from(JSON.stringify(contents, null, '  '));
      _this.push(file);
      return done();
    }).catch(function (err) {
      return done(err);
    });
  }

  return (0, _through.obj)(transform);
}

function deployFromTemplates(params) {
  function transform(file, enc, done) {
    var _this2 = this;

    if (file.isNull()) {
      this.push(file);
      return done();
    }

    var StackName = _path2.default.basename(file.path, '.json');
    var TemplateBody = file.contents.toString(enc);

    deployCloudFormation(_extends({
      StackName: StackName,
      TemplateBody: TemplateBody
    }, params)).then(function (contents) {
      file.contents = Buffer.from(JSON.stringify(contents, null, '  '));
      _this2.push(file);
      return done();
    }).catch(function (err) {
      return done(err);
    });
  }

  return (0, _through.obj)(transform);
}

function convertParameters() {
  function transform(file, enc, done) {
    if (file.isNull()) {
      this.push(file);
      return done();
    }

    var contents = JSON.parse(file.contents.toString(enc));
    file.contents = Buffer.from(JSON.stringify(Object.keys(contents).reduce(function (acc, key) {
      acc.Parameters[key] = { Type: 'String', Default: contents[key] };
      return acc;
    }, { Parameters: {} })));
    this.push(file);
    return done();
  }

  return (0, _through.obj)(transform);
}

exports.default = deployFromTemplates;