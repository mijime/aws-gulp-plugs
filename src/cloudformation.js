import path from 'path';
import {obj} from 'through2';
import {CloudFormation} from 'aws-sdk';
import util from 'gulp-util';

const cf = new CloudFormation();

function deployCloudFormation(params) {
  const {StackName} = params;

  return cf.describeStacks({
    StackName
  }).promise()
    .catch(() => cf.createStack(params).promise()
      .then(() => cf.waitFor('stackCreateComplete', {
        StackName
      }).promise()))
    .then(() => cf.updateStack(params).promise().catch(err => {
      if (err.code === 'ValidationError') {
        util.log(err.message);
        return;
      }

      throw err;
    }).then(() => cf.waitFor('stackUpdateComplete', {
      StackName
    }).promise()))
    .then(() => cf.describeStacks({
      StackName
    }).promise())
    .then(({Stacks}) => Stacks.map(({Outputs}) => {
      return Outputs.reduce((acc, {OutputKey, OutputValue}) => {
        acc[OutputKey] = OutputValue;
        return acc;
      }, {});
    }).reduce((_, latest) => latest));
}

export function deployFromParameters(params) {
  function transform(file, enc, done) {
    if (file.isNull()) {
      this.push(file);
      done();
      return;
    }

    const ParameterObjects = JSON.parse(
      file.contents.toString(enc));

    const Parameters = Object.keys(ParameterObjects)
      .map(ParameterKey => ({
        ParameterKey,
        ParameterValue: ParameterObjects[ParameterKey]
      }));

    deployCloudFormation({
      Parameters,
      ...params
    }).then(contents => {
      file.contents = Buffer.from(JSON.stringify(
        contents, null, '  '));
      this.push(file);
      return done();
    }).catch(err => done(err));
  }

  return obj(transform);
}

export function deployFromTemplates(params) {
  function transform(file, enc, done) {
    if (file.isNull()) {
      this.push(file);
      return done();
    }

    const StackName = path.basename(file.path, '.json');
    const TemplateBody = file.contents.toString(enc);

    deployCloudFormation({
      StackName,
      TemplateBody,
      ...params
    }).then(contents => {
      file.contents = Buffer.from(JSON.stringify(
        contents, null, '  '));
      this.push(file);
      return done();
    }).catch(err => done(err));
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

export default deployFromTemplates;
