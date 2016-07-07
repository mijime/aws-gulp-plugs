export class Promisify {
  constructor(context) {
    this.context = context;
  }

  node(func) {
    return (...args) => {
      return new Promise((resolve, reject) => {
        return this.context[func].apply(this.context, args.concat([(err, res) => {
          if (err) {
            return reject(err);
          }

          return resolve(res);
        }]));
      });
    };
  }
}

export function nodePromise(target, func, ...args) {
  return new Promise((resolve, reject) => {
    return func.apply(target, args.concat([(err, res) => {
      if (err) {
        return reject(err);
      }

      return resolve(res);
    }]));
  });
}
