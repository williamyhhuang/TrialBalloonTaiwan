/* eslint-disable space-before-function-paren */
/* eslint-disable prefer-promise-reject-errors */
/* eslint-disable max-len */
/* eslint-disable require-jsdoc */
const mysql = require('../../util/mysqlcon');
const redis = require('redis');
const moment = require('moment');
const client = redis.createClient({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
});

function insertNews(connect, media, date, title, url, score, magnitude) {
  return new Promise((resolve, reject) => {
    // 新增新聞資料
    const sql = `INSERT INTO news SET ?`;
    const post = {
      media: media,
      date: date,
      title: title,
      url: url,
      score: score,
      magnitude: magnitude,
    };
    connect.query(sql, post, function (err, result) {
      if (err) {
        reject(err);
      }
      if (result == undefined) {
        reject('error from getting newsId');
        return;
      }
      resolve({
        answer: true,
        newsId: result.insertId,
      });
    });
  });
}

function insertArticle(connect, article, url, tokenize) {
  return new Promise((resolve, reject) => {
    // 新增新聞文章
    const sql = `INSERT INTO article SET ?`;
    const post = {
      article: article,
      news_url: url,
      tokenize: tokenize,
    };
    connect.query(sql, post, function (err, result) {
      if (err) {
        reject(err);
      }
      resolve();
    });
  });
}

function insertKeyword(connect, keyword, newsId) {
  return new Promise((resolve, reject) => {
    // 新增關鍵字
    const sql = `INSERT INTO keyword SET ?`;
    const post = {
      keyword: keyword,
      news_id: newsId,
      add_in_dict: 'no',
    };
    connect.query(sql, post, function (err, result) {
      if (err) {
        reject(err);
      }
      resolve();
    });
  });
}

function getReporterId(connect, author, media) {
  return new Promise((resolve, reject) => {
    const sql = `SELECT id FROM reporter WHERE name = ?`;
    connect.query(sql, [author], function (err, result) {
      if (err) {
        reject(err);
      }
      if (result.length > 0) {
        const reporterId = result[0].id;
        resolve(reporterId);
      } else {
        const sql = `INSERT INTO reporter SET ?`;
        const post = {
          name: author,
          media: media,
        };
        connect.query(sql, post, function (insertReporterErr, insertReporterResult) {
          if (insertReporterErr) {
            reject(insertReporterErr);
          }

          if (insertReporterResult == undefined) {
            reject('err from getting reporterId');
            return;
          }
          // 清除Redis
          client.flushdb(function (err, reply) {
            const t = moment().format('YYYY-MM-DD-HH:mm:ss');
            if (err) {
              reject(err);
            };
            console.log(t, 'Clear Redis from reporter\'s name result: ', reply);
            const reporterId = insertReporterResult.insertId;
            resolve(reporterId);
          });
        });
      }
    });
  });
}

function insertReporterNews(connect, reporterId, newsId) {
  return new Promise((resolve, reject) => {
    // 新增記者與新聞間之關係
    const sql = `INSERT INTO reporter_has_news SET ?`;
    const post = {
      reporter_id: reporterId,
      news_id: newsId,
    };
    connect.query(sql, post, function (err, result) {
      if (err) {
        reject(err);
      }
      resolve();
    });
  });
}

function checkUrl(url) {
  const t = moment().format('YYYY-MM-DD-HH:mm:ss');
  return new Promise((resolve, reject) => {
    const sql = `SELECT id FROM news WHERE url = ?`;
    mysql.query(sql, [url], function (err, result) {
      if (err) {
        reject('error from checking url query');
        console.log(t, 'Error from checkUrl', err);
      }
      if (result) {
        resolve(result);
      }
    });
  });
}

function getDbUrl(media) {
  const t = moment().format('YYYY-MM-DD-HH:mm:ss');
  return new Promise((resolve, reject) => {
    mysql.query(`SELECT url FROM news WHERE media = ? FOR UPDATE`, [media], function (err, result) {
      if (err) {
        console.log(t, 'Error from getDbUrl', err);
      }
      const urls = [];
      for (let i = 0; i < result.length; i++) {
        urls.push(result[i].url);
      }
      resolve(urls);
    });
  });
}

function insert(data) {
  const media = data.media;
  const date = data.date;
  const url = data.url;
  const title = data.title;
  const author = data.author;
  const article = data.article;
  const tokenize = data.tokenize;
  const score = data.score;
  const magnitude = data.magnitude;
  const keywords = data.keyword;
  const t = moment().format('YYYY-MM-DD-HH:mm:ss');

  return new Promise((resolve, reject) => {
    // 新增至資料庫
    mysql.getConnection(function (err, connect) {
      if (err) {
        console.log(t, 'Error from getConnection', err);
        connect.release();
      }
      connect.beginTransaction(async function (err) {
        if (err) {
          console.log(t, 'Error from beginTransaction', err);
          connect.release();
        }
        try {
          let newsId;
          await insertNews(connect, media, date, title, url, score, magnitude)
              .then(async (newsTestResult) => {
                try {
                  newsId = newsTestResult.newsId;
                  await insertArticle(connect, article, url, tokenize);
                  for (let i = 0; i < keywords.length; i++) {
                    await insertKeyword(connect, keywords[i], newsId);
                  }
                  for (let i = 0; i < author.length; i++) {
                    author[i] = author[i].trim();
                    if (author[i].length <= 1) {
                      author[i] = media;
                    }
                    const reporterId = await getReporterId(connect, author[i], media);
                    await insertReporterNews(connect, reporterId, newsId);
                  }
                } catch (err) {
                  console.log(t, err);
                }
              })
              .then(() => {
                connect.commit(function (err) {
                  if (err) {
                    console.log(t, 'err from commit', err);
                    connect.rollback(function () {
                      connect.release();
                    });
                  }
                  console.log(t, ' Success message from adding news: ', media, ' ', title);
                  resolve(true);
                  connect.release();
                });
              });
        } catch (err) {
          console.log(t, media, 'Error from transaction', err);
          connect.rollback(function () {
            connect.release();
          });
        }
      });
    });
  });
}

module.exports = {
  insertNews: insertNews,
  insertArticle: insertArticle,
  insertKeyword: insertKeyword,
  getReporterId: getReporterId,
  insertReporterNews: insertReporterNews,
  checkUrl: checkUrl,
  getDbUrl: getDbUrl,
  insert: insert,
};
