"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.nodePromise = nodePromise;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Promisify = exports.Promisify = function () {
  function Promisify(context) {
    _classCallCheck(this, Promisify);

    this.context = context;
  }

  _createClass(Promisify, [{
    key: "node",
    value: function node(func) {
      var _this = this;

      return function () {
        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }

        return new Promise(function (resolve, reject) {
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

  return new Promise(function (resolve, reject) {
    return func.apply(target, args.concat([function (err, res) {
      if (err) {
        return reject(err);
      }

      return resolve(res);
    }]));
  });
}