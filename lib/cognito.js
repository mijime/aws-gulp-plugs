'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

exports.default = identityPool;

var _through = require('through2');

var _awsSdk = require('aws-sdk');

var _utils = require('./utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var MaxResults = 10;

function identityPool(params) {
  var identity = new _awsSdk.CognitoIdentity(params);

  function transform(file, enc, done) {
    var _this = this;

    if (file.isNull()) {
      this.push(file);
      return done();
    }

    var _JSON$parse = JSON.parse(file.contents.toString(enc)),
        IdentityPoolName = _JSON$parse.IdentityPoolName,
        _JSON$parse$AllowUnau = _JSON$parse.AllowUnauthenticatedIdentities,
        AllowUnauthenticatedIdentities = _JSON$parse$AllowUnau === undefined ? true : _JSON$parse$AllowUnau,
        AuthenticatedRole = _JSON$parse.AuthenticatedRole,
        UnAuthenticatedRole = _JSON$parse.UnAuthenticatedRole;

    return new _promise2.default(function (resolve, reject) {
      return findIdentityPools(identity)(resolve, reject, {
        IdentityPoolName: IdentityPoolName
      });
    }).catch(function () {
      return (0, _utils.nodePromise)(identity, identity.createIdentityPool, {
        IdentityPoolName: IdentityPoolName,
        AllowUnauthenticatedIdentities: AllowUnauthenticatedIdentities
      });
    }).then(function (_ref) {
      var IdentityPoolId = _ref.IdentityPoolId;

      return (0, _utils.nodePromise)(identity, identity.setIdentityPoolRoles, {
        IdentityPoolId: IdentityPoolId,
        Roles: {
          authenticated: AuthenticatedRole,
          unauthenticated: UnAuthenticatedRole
        }
      }).then(function () {
        return { IdentityPoolId: IdentityPoolId };
      });
    }).then(function (res) {
      file.contents = Buffer.from((0, _stringify2.default)(res, null, '  '));
      _this.push(file);
      return done();
    }).catch(function (err) {
      console.log(err);
      return done();
    });
  }

  return (0, _through.obj)(transform);
}

function findIdentityPools(identity) {
  return function listIdentityPools(resolve, reject, params) {
    var IdentityPoolName = params.IdentityPoolName,
        currentToken = params.currentToken;


    return identity.listIdentityPools({
      MaxResults: MaxResults,
      NextToken: currentToken
    }, function (err, res) {
      if (err) {
        reject(err);
        return;
      }

      var IdentityPools = res.IdentityPools,
          NextToken = res.NextToken;


      var matchedPool = IdentityPools.reduce(function (matchPool, pool) {
        if (matchPool) {
          return matchPool;
        }

        if (IdentityPoolName === pool.IdentityPoolName) {
          return pool;
        }

        return null;
      }, null);

      if (matchedPool) {
        resolve(matchedPool);
        return;
      }

      if (!NextToken) {
        reject(new Error('Empty identity pools: ' + IdentityPoolName));
        return;
      }

      listIdentityPools(resolve, reject, {
        IdentityPoolName: IdentityPoolName,
        MaxResults: MaxResults,
        currentToken: NextToken
      });
    });
  };
}
module.exports = exports['default'];