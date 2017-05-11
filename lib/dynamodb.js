'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

exports.default = batchWriteItem;

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _through = require('through2');

var _awsSdk = require('aws-sdk');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function batchWriteItem() {
  for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }

  var dynamodb = new (Function.prototype.bind.apply(_awsSdk.DynamoDB, [null].concat(args)))();

  return (0, _through.obj)(function (file, enc, done) {
    var TableName = _path2.default.basename(file.path, '.json');
    var records = JSON.parse(file.contents.toString(enc));
    var putRequests = records.map(function (record) {
      var Item = (0, _keys2.default)(record).map(function (key) {
        var k = key.split(' ');
        var kName = k[0];
        var kType = k[1];
        var value = record[key];

        if (!value) {
          return {};
        }

        switch (kType) {
          case '(M)':
            return { key: kName, value: { M: JSON.parse(record[key]) } };
          default:
            return { key: kName, value: { S: record[key] } };
        }
      }).reduce(function (acc, _ref) {
        var key = _ref.key,
            value = _ref.value;

        if (!key || !value) {
          return acc;
        }

        acc[key] = value;
        return acc;
      }, {});

      return { PutRequest: { Item: Item } };
    });
    var RequestItems = {};
    RequestItems[TableName] = putRequests;

    dynamodb.batchWriteItem({ RequestItems: RequestItems }, function (err) {
      if (err) {
        return done(err);
      }
      return done();
    });
  });
}
module.exports = exports['default'];