import {obj} from 'through2';

export default function jsonMerge() {
  const list = [];
  let tmpfile = null;

  function transform(file, enc, done) {
    if (file.isNull()) {
      this.push(file);
      return done();
    }

    const data = JSON.parse(file.contents.toString(enc));
    list.push(data);
    tmpfile = file;
    return done();
  }

  function flush(done) {
    if (!tmpfile) {
      return done();
    }

    const extendData = list.reduce(extend, {});
    tmpfile.contents = Buffer.from(JSON.stringify(extendData, null, '  '));
    this.push(tmpfile);
    return done();
  }

  return obj(transform, flush);
}

function extend(acc, node) {
  if (node === null) {
    return acc;
  }

  if ((Array.isArray(acc)) && (Array.isArray(node))) {
    return acc.concat(node);
  }

  if ((acc instanceof Object) && (node instanceof Object)) {
    return Object.keys(node).reduce((a, key) => {
      a[key] = extend(a[key], node[key]);
      return a;
    }, acc);
  }

  return node;
}
