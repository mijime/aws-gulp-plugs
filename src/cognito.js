import {obj} from 'through2';
import {CognitoIdentity} from 'aws-sdk';

const MaxResults = 10;

export default function identityPool(params) {
  const identity = new CognitoIdentity(params);

  return obj(function transform(file, enc, done) {
    if (file.isNull()) {
      this.push(file);
      return done();
    }

    const {
      IdentityPoolName,
      AllowUnauthenticatedIdentities = true,
      AuthenticatedRole,
      UnAuthenticatedRole
    } = JSON.parse(file.contents.toString(enc));

    return new Promise((resolve, reject) => {
      return findIdentityPools(identity)(resolve, reject, {
        IdentityPoolName
      });

    }).catch(() => {
      return nodePromise(identity, identity.createIdentityPool, {
        IdentityPoolName,
        AllowUnauthenticatedIdentities
      });

    }).then(({IdentityPoolId}) => {
      return nodePromise(identity, identity.setIdentityPoolRoles, {
        IdentityPoolId,
        Roles: {
          authenticated: AuthenticatedRole,
          unauthenticated: UnAuthenticatedRole
        }
      }).then(() => {
        return {IdentityPoolId};
      });
    }).then(res => {
      file.contents = new Buffer(JSON.stringify(res, null, '  '));
      this.push(file);
      return done();
    }).catch(err => {
      console.log(err);
      return done();
    });
  });
}

function findIdentityPools(identity) {
  return function listIdentityPools(resolve, reject, params) {
    const {
      IdentityPoolName,
      currentToken
    } = params;

    return identity.listIdentityPools({
      MaxResults,
      NextToken: currentToken
    }, (err, res) => {
      if (err) {
        reject(err);
        return;
      }

      const {IdentityPools, NextToken} = res;

      const matchedPool = IdentityPools.reduce((matchPool, pool) => {
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
        reject(new Error(`Empty identity pools: ${IdentityPoolName}`));
        return;
      }

      listIdentityPools(resolve, reject, {
        IdentityPoolName,
        MaxResults,
        currentToken: NextToken
      });
      return;
    });
  };
}

function nodePromise(target, func, ...args) {
  return new Promise((resolve, reject) => {
    return func.apply(target, args.concat([(err, res) => {
      if (err) {
        return reject(err);
      }

      return resolve(res);
    }]));
  });
}
