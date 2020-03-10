const {truncateFakeData, closeConnection} = require('./fakeDataGenerator');

afterAll(async () => {
  await truncateFakeData();
  await closeConnection();
});
