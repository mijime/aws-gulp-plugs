import path from 'path';
import {obj} from 'through2';
import {DynamoDB} from 'aws-sdk';

export default function batchWriteItem(...args) {
  const dynamodb = new DynamoDB(...args);

  return obj((file, enc, done) => {
    const TableName = path.basename(file.path, '.json');
    const records = JSON.parse(file.contents.toString(enc));
    const putRequests = records.map(record => {
      const Item = Object.keys(record).map(key => {
        const k = key.split(' ');
        const kName = k[0];
        const kType = k[1];
        const value = record[key];

        if (!value) {
          return {};
        }

        switch (kType) {
          case '(M)':
            return {key: kName, value: {M: JSON.parse(record[key])}};
          default:
            return {key: kName, value: {S: record[key]}};
        }
      }).reduce((acc, {key, value}) => {
        if (!key || !value) {
          return acc;
        }

        acc[key] = value;
        return acc;
      }, {});

      return {PutRequest: {Item}};
    });
    const RequestItems = {};
    RequestItems[TableName] = putRequests;

    dynamodb.batchWriteItem({RequestItems}, err => {
      if (err) {
        return done(err);
      }
      return done();
    });
  });
}
