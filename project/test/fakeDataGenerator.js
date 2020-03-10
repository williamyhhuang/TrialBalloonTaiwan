/* eslint-disable indent */
/* eslint-disable camelcase */
/* eslint-disable object-curly-spacing */
/* eslint-disable space-before-function-paren */
/* eslint-disable max-len */
/* eslint-disable require-jsdoc */
const { NODE_ENV } = process.env;
const pool = require('../util/mysqlcon');
const {
  news,
  article,
  keyword,
  reporter,
  reporter_has_news,
} = require('./fakeData');

function insertNews(data) {
  return new Promise((resolve, reject) => {
    pool.query('INSERT INTO tbt_test.news SET ?', data, function (err, result) {
      if (err) {
        reject(err);
      }
    });
  });
};

function insertArticle(data) {
  return new Promise((resolve, reject) => {
    pool.query('INSERT INTO tbt_test.article SET ?', data, function (err, result) {
      if (err) {
        reject(err);
      }
    });
  });
};

function insertKeyword(data) {
  return new Promise((resolve, reject) => {
    pool.query('INSERT INTO tbt_test.keyword SET ?', data, function (err, result) {
      if (err) {
        reject(err);
      }
    });
  });
};

function insertReporter(data) {
  return new Promise((resolve, reject) => {
    pool.query('INSERT INTO tbt_test.reporter SET ?', data, function (err, result) {
      if (err) {
        reject(err);
      }
    });
  });
};

function insertReporterNews(data) {
  return new Promise((resolve, reject) => {
    pool.query('INSERT INTO tbt_test.reporter_has_news SET ?', data, function (err, result) {
      if (err) {
        reject(err);
      }
    });
  });
};

async function insertData() {
  try {
    news.forEach((el) => {
      insertNews(el);
    });
    article.forEach((el) => {
      insertArticle(el);
    });
    keyword.forEach((el) => {
      insertKeyword(el);
    });
    reporter.forEach((el) => {
      insertReporter(el);
    });
    reporter_has_news.forEach((el) => {
      insertReporterNews(el);
    });
  } catch (err) {
    console.log(err);
  }
}

function truncateFakeData() {
  if (NODE_ENV !== 'test') {
    console.log('Not in test env');
    return;
  }

  console.log('truncate fake data');
  const setForeignKey = (status) => {
    return query('SET FOREIGN_KEY_CHECKS = ?', status);
  };

  const truncateTable = (table) => {
    return query(`TRUNCATE TABLE ${table}`);
  };

  return setForeignKey(0)
    .then(truncateTable('news'))
    .then(truncateTable('article'))
    .then(truncateTable('keyword'))
    .then(truncateTable('reporter'))
    .then(truncateTable('reporter_has_news'))
    .then(setForeignKey(1))
    .catch(console.log);
};

function closeConnection() {
  pool.end(function (err) {
    if (err) {
      console.log(err);
    }
  });
}

module.exports = {
  insertData,
  truncateFakeData,
  closeConnection,
};
