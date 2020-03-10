/* eslint-disable object-curly-spacing */
/* eslint-disable no-throw-literal */
const { NODE_ENV } = process.env;
const { insertData, truncateFakeData } = require('./fakeDataGenerator');

beforeAll(async () => {
  if (NODE_ENV !== 'test') {
    throw 'Not in test env';
  }
  await truncateFakeData();
  await insertData();
});
