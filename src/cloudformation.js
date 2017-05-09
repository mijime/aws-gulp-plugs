import path from 'path';
import {obj} from 'through2';
import {CloudFormation} from 'aws-sdk';
import {Promisify} from './utils';

export default function deployCloudFormation(params) {
  const cf = new Promisify(new CloudFormation());

  function transform(file, enc, done) {
    if (file.isNull()) {
      this.push(file);
      return done();
    }

    const StackName = path.basename(file.path, '.json');
    const TemplateBody = file.contents.toString(enc);

    return cf.node('describeStacks')({StackName}).catch(() => {
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
      file.contents = Buffer.from(JSON.stringify(output, null, '  '));
      this.push(file);
      return done();
    }).catch(err => {
      console.log(err);
      return done(err);
    });
  }

  return obj(transform);
}

export function convertParameters() {
  function transform(file, enc, done) {
    if (file.isNull()) {
      this.push(file);
      return done();
    }

    const contents = JSON.parse(file.contents.toString(enc));
    file.contents = Buffer.from(JSON.stringify(Object.keys(contents)
      .reduce((acc, key) => {
        acc.Parameters[key] = {Type: 'String', Default: contents[key]};
        return acc;
      }, {Parameters: {}})));
    this.push(file);
    return done();
  }

  return obj(transform);
}
