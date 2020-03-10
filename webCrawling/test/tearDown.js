/* eslint-disable no-throw-literal */
const {NODE_ENV} = process.env;
const {truncateFakeData, closeConnection} = require('./fakeDataGenerator');

// afterAll(async () => {
//   await truncateFakeData();
//   await closeConnection();
// });

module.exports = async () => {
  if (NODE_ENV !== 'test') {
    throw 'Not in test env';
  }
  await truncateFakeData();
  await closeConnection();
};
