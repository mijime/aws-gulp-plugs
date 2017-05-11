"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Promisify = undefined;

var _promise = require("babel-runtime/core-js/promise");

var _promise2 = _interopRequireDefault(_promise);

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

exports.nodePromise = nodePromise;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Promisify = exports.Promisify = function () {
  function Promisify(context) {
    (0, _classCallCheck3.default)(this, Promisify);

    this.context = context;
  }

  (0, _createClass3.default)(Promisify, [{
    key: "node",
    value: function node(func) {
      var _this = this;

      return function () {
        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }

        return new _promise2.default(function (resolve, reject) {
          return _this.context[func].apply(_this.context, args.concat([function (err, res) {
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

function nodePromise(target, func) {
  for (var _len2 = arguments.length, args = Array(_len2 > 2 ? _len2 - 2 : 0), _key2 = 2; _key2 < _len2; _key2++) {
    args[_key2 - 2] = arguments[_key2];
  }

  return new _promise2.default(function (resolve, reject) {
    return func.apply(target, args.concat([function (err, res) {
      if (err) {
        return reject(err);
      }

      return resolve(res);
    }]));
  });
}