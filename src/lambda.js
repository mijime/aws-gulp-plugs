import path from 'path';
import {obj} from 'through2';
import {Lambda} from 'aws-sdk';
import {ZipFile} from 'yazl';
import concat from 'concat-stream';
import browserify from 'browserify';

export default function updateFunctionCode(...args) {
  const lambda = new Lambda(...args);

  return obj(function transform(file, _, done) {
    if (file.isNull()) {
      return done();
    }

    const FunctionName = path.basename(file.path, '.js');
    lambda.updateFunctionCode({
      FunctionName,
      ZipFile: file.contents
    }, err => {
      if (err) {
        done(err);
        return;
      }

      this.push(file);
      return done();
    });
  });
}

export function createLambdaZip() {
  return obj(function transform(file, _, done) {
    if (file.isNull()) {
      return done();
    }

    const zip = new ZipFile();
    const filename = 'index.js';
    const stat = {
      compress: true,
      mtime: file.stat ? file.stat.mtime : new Date(),
      mode: file.stat ? file.stat.mode : null
    };
    const filepath = path.join(
        path.dirname(file.path),
        `${path.basename(file.path, '.js')}.zip`);

    if (file.isStream()) {
      zip.addReadStream(file.contents, filename, stat);
    }
    if (file.isBuffer()) {
      zip.addBuffer(file.contents, filename, stat);
    }

    zip.end(() => {
      zip.outputStream.pipe(concat(data => {
        file.path = filepath;
        file.contents = data;
        this.push(file);
        return done();
      }));
    });
  });
}

export function tapBrowserifyForNode(bundle = b => b) {
  return obj(function transform(file, enc, done) {
    if (file.isNull()) {
      return done();
    }

    const bundler = browserify(file.path, {
      detectGlobals: false,
      builtins: false,
      commondir: false,
      browserField: false,
      standalone: 'code'
    });

    file.contents = bundle(bundler).bundle();
    this.push(file);
    return done();
  });
}
