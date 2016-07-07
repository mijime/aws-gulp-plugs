import path from 'path';
import {obj} from 'through2';
import {CloudFormation} from 'aws-sdk';

export default function deployCloudFormation(params) {
  const cf = new Promisify(new CloudFormation());

  return obj(function transform(file, enc, done) {
    if (file.isNull()) {
      this.push(file);
      return done();
    }

    const StackName = path.basename(file.path, '.json');
    const TemplateBody = file.contents.toString(enc);

    return cf.node('describeStacks')({StackName}).catch(err => {
      console.log(err);

      return cf.node('createStack')({
        StackName,
        TemplateBody,
        ...params
      }).then(() => {
        return cf.node('waitFor')('stackCreateComplete', {StackName});
      });

    }).then(() => {
      return cf.node('updateStack')({
        StackName,
        TemplateBody,
        ...params
      }).then(() => {
        return cf.node('waitFor')('stackUpdateComplete', {StackName});

      }).catch(err => {
        if (err.message === 'No updates are to be performed.') {
          return;
        }

        throw err;
      });
    }).then(() => {
      return cf.node('describeStacks')({StackName});

    }).then(({Stacks}) => {
      return Stacks.map(({Outputs}) => {
        return Outputs.reduce((acc, {OutputKey, OutputValue}) => {
          acc[OutputKey] = OutputValue;
          return acc;
        }, {});
      }).reduce((_, latest) => latest);

    }).then(output => {
      file.contents = new Buffer(JSON.stringify(output, null, '  '));
      this.push(file);
      return done();

    }).catch(err => {
      console.log(err);
      return done(err);
    });
  });
}

class Promisify {
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
