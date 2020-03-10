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
      resolve();
    });
  });
};

function insertArticle(data) {
  return new Promise((resolve, reject) => {
    pool.query('INSERT INTO tbt_test.article SET ?', data, function (err, result) {
      if (err) {
        reject(err);
      }
      resolve();
    });
  });
};

function insertKeyword(data) {
  return new Promise((resolve, reject) => {
    pool.query('INSERT INTO tbt_test.keyword SET ?', data, function (err, result) {
      if (err) {
        reject(err);
      }
      resolve();
    });
  });
};

function insertReporter(data) {
  return new Promise((resolve, reject) => {
    pool.query('INSERT INTO tbt_test.reporter SET ?', data, function (err, result) {
      if (err) {
        reject(err);
      }
      resolve();
    });
  });
};

function insertReporterNews(data) {
  return new Promise((resolve, reject) => {
    pool.query('INSERT INTO tbt_test.reporter_has_news SET ?', data, function (err, result) {
      if (err) {
        reject(err);
      }
      resolve();
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

const setForeignKey = (status) => {
  return new Promise((resolve, reject) => {
    pool.query('SET FOREIGN_KEY_CHECKS = ?', status, function (err, result) {
      if (err) {
        reject(err);
      }
      console.log('setForeignKey success', status);
      resolve();
    });
  });
};

const truncateTable = (table) => {
  return new Promise((resolve, reject) => {
    pool.query(`TRUNCATE TABLE ${table}`, function (err, result) {
      if (err) {
        reject(err);
      }
      console.log('truncate ', table, 'success');
      resolve();
    });
  });
};

async function truncateFakeData() {
  if (NODE_ENV !== 'test') {
    console.log('Not in test env');
    return;
  }
  try {
    console.log('truncate fake data');
    await setForeignKey(0);
    await truncateTable('tbt_test.news');
    await truncateTable('tbt_test.article');
    await truncateTable('tbt_test.keyword');
    await truncateTable('tbt_test.reporter');
    await truncateTable('tbt_test.reporter_has_news');
    // await setForeignKey(1);
  } catch (err) {
    console.log(err);
  }
};

function closeConnection() {
  return new Promise((resolve, reject)=>{
    pool.end(function (err) {
      if (err) {
        reject(err);
      }
      resolve();
    });
  });
}

module.exports = {
  insertData,
  truncateFakeData,
  closeConnection,
};
