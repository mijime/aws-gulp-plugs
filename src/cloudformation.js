import path from 'path';
import {obj} from 'through2';
import {CloudFormation} from 'aws-sdk';

const cf = new CloudFormation();

async function deployCloudFormation(params) {
  const {StackName} = params;

  try {
    await cf.describeStacks({
      StackName
    }).promise();

    await cf.updateStack(params).promise();
  } catch (err) {
    await cf.createStack(params).promise();
  }

  await cf.waitFor('stackCreateComplete', {
    StackName
  }).promise();

  const {Stacks} = await cf.describeStacks({
    StackName
  }).promise();

  return Stacks.map(({Outputs}) => {
    return Outputs.reduce((acc, {OutputKey, OutputValue}) => {
      acc[OutputKey] = OutputValue;
      return acc;
    }, {});
  }).reduce((_, latest) => latest);
}

export function deployFromParameters(params) {
  async function transform(file, enc, done) {
    if (file.isNull()) {
      this.push(file);
      done();
      return;
    }

    const ParameterObjects = JSON.parse(
      file.contents.toString(enc));
    const Parameters = ParameterObjects.keys()
      .map(ParameterKey => ({
        ParameterKey,
        ParameterValue: ParameterObjects[ParameterKey]
      }));

    try {
      const contents = await deployCloudFormation({
        Parameters,
        ...params
      });

      file.contents = Buffer.from(JSON.stringify(
        contents, null, '  '));
      this.push(file);
      done();
      return;
    } catch (err) {
      done(err);
    }
  }

  return obj(transform);
}

export function deployFromTemplates(params) {
  async function transform(file, enc, done) {
    if (file.isNull()) {
      this.push(file);
      return done();
    }

    const StackName = path.basename(file.path, '.json');
    const TemplateBody = file.contents.toString(enc);

    try {
      const contents = await deployCloudFormation({
        StackName,
        TemplateBody,
        ...params
      });

      file.contents = Buffer.from(JSON.stringify(
        contents, null, '  '));
      this.push(file);
      done();
      return;
    } catch (err) {
      done(err);
    }
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
