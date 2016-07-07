'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = identityPool;

var _through = require('through2');

var _awsSdk = require('aws-sdk');

var MaxResults = 10;

function identityPool(params) {
  var identity = new _awsSdk.CognitoIdentity(params);

  return (0, _through.obj)(function transform(file, enc, done) {
    var _this = this;

    if (file.isNull()) {
      this.push(file);
      return done();
    }

    var _JSON$parse = JSON.parse(file.contents.toString(enc));

    var IdentityPoolName = _JSON$parse.IdentityPoolName;
    var _JSON$parse$AllowUnau = _JSON$parse.AllowUnauthenticatedIdentities;
    var AllowUnauthenticatedIdentities = _JSON$parse$AllowUnau === undefined ? true : _JSON$parse$AllowUnau;
    var AuthenticatedRole = _JSON$parse.AuthenticatedRole;
    var UnAuthenticatedRole = _JSON$parse.UnAuthenticatedRole;


    return new Promise(function (resolve, reject) {
      return findIdentityPools(identity)(resolve, reject, {
        IdentityPoolName: IdentityPoolName
      });
    }).catch(function () {
      return nodePromise(identity, identity.createIdentityPool, {
        IdentityPoolName: IdentityPoolName,
        AllowUnauthenticatedIdentities: AllowUnauthenticatedIdentities
      });
    }).then(function (_ref) {
      var IdentityPoolId = _ref.IdentityPoolId;

      return nodePromise(identity, identity.setIdentityPoolRoles, {
        IdentityPoolId: IdentityPoolId,
        Roles: {
          authenticated: AuthenticatedRole,
          unauthenticated: UnAuthenticatedRole
        }
      }).then(function () {
        return { IdentityPoolId: IdentityPoolId };
      });
    }).then(function (res) {
      file.contents = new Buffer(JSON.stringify(res, null, '  '));
      _this.push(file);
      return done();
    }).catch(function (err) {
      console.log(err);
      return done();
    });
  });
}

function findIdentityPools(identity) {
  return function listIdentityPools(resolve, reject, params) {
    var IdentityPoolName = params.IdentityPoolName;
    var currentToken = params.currentToken;


    return identity.listIdentityPools({
      MaxResults: MaxResults,
      NextToken: currentToken
    }, function (err, res) {
      if (err) {
        reject(err);
        return;
      }

      var IdentityPools = res.IdentityPools;
      var NextToken = res.NextToken;


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
      return;
    });
  };
}

function nodePromise(target, func) {
  for (var _len = arguments.length, args = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
    args[_key - 2] = arguments[_key];
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
module.exports = exports['default'];