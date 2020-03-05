const mysql = require('../../util/mysqlcon');
const redis = require('redis');
const moment = require('moment');
const client = redis.createClient({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT
});

function insertNews(connect, media, date, title, url, score, magnitude) {
  return new Promise((resolve, reject) => {
    // 新增新聞資料
    let insertNewsSql = `INSERT INTO tbt.news SET ?`
    let insertNewsPost = {
      media: media,
      date: date,
      title: title,
      url: url,
      score: score,
      magnitude: magnitude
    };
    connect.query(insertNewsSql, insertNewsPost, function (insertNewsErr, insertNewsResult) {
      if (insertNewsErr) {
        reject(insertNewsErr)
      }
      if (insertNewsResult == undefined) {
        reject('error from getting newsId');
        return;
      }
      resolve({
        answer: true,
        newsId: insertNewsResult.insertId
      })
    })
  })
}

function insertArticle(connect, article, url, tokenize) {
  return new Promise((resolve, reject) => {
    // 新增新聞文章
    let insertArticleSql = `INSERT INTO tbt.article SET ?`
    let insertArticlePost = {
      article: article,
      news_url: url,
      tokenize: tokenize
    }
    connect.query(insertArticleSql, insertArticlePost, function (insertArticleErr, insertArticleResult) {
      if (insertArticleErr) {
        reject(insertArticleErr)
      }
      resolve(true)
    })
  })
}

function insertKeyword(connect, keyword, newsId) {
  let results = [];
  return new Promise((resolve, reject) => {
    // 新增關鍵字
    let insertKeywordsSql = `INSERT INTO tbt.keyword SET ?`
    let insertKeywordsPost = {
      keyword: keyword,
      news_id: newsId,
      add_in_dict: 'no'
    }
    connect.query(insertKeywordsSql, insertKeywordsPost, function (insertKeywordsErr, insertKeywordsResult) {
      if (insertKeywordsErr) {
        reject(insertKeywordsErr)
      }
      results.push(true)
    })
    resolve(results)
  })
}

function getReporterId(connect, author, media) {
  return new Promise((resolve, reject) => {
    let selectReporterSql = `SELECT id FROM reporter WHERE name = ?`;
    connect.query(selectReporterSql, [author], function (selectReporterErr, selectReporterResult) {
      if (selectReporterErr) {
        reject(selectReporterErr)
      }
      if (selectReporterResult.length > 0) {
        let reporterId = selectReporterResult[0].id
        resolve(reporterId)
      } else {
        let insertReporterSql = `INSERT INTO tbt.reporter SET ?`;
        let insertReporterPost = {
          name: author,
          media: media
        }
        connect.query(insertReporterSql, insertReporterPost, function (insertReporterErr, insertReporterResult) {
          if (insertReporterErr) {
            reject(insertReporterErr)
          }

          if (insertReporterResult == undefined) {
            reject('err from getting reporterId');
            return;
          }
          // 清除Redis
          client.flushdb(function (err, reply) {
            let t = moment().format('YYYY-MM-DD-HH:mm:ss');
            if (err) {
              reject(err);
            };
            console.log(t, "Clear Redis from reporter's name result: ", reply);
          });
          let reporterId = insertReporterResult.insertId;
          resolve(reporterId)
        })
      }
    })
  })
}

function insertReporterNews(connect, reporterId, newsId) {
  return new Promise((resolve, reject) => {
    let results = []
    // 新增記者與新聞間之關係
    let insertReporterNewsSql = `INSERT INTO tbt.reporter_has_news SET ?`
    let insertReporterNewsPost = {
      reporter_id: reporterId,
      news_id: newsId
    }
    connect.query(insertReporterNewsSql, insertReporterNewsPost, function (insertReporterNewsErr, insertReporterNewsResult) {
      if (insertReporterNewsErr) {
        reject(insertReporterNewsErr)
      }
      results.push(true)
    })
    resolve(true)
  })
}

function checkUrl(url) {
  let t = moment().format('YYYY-MM-DD-HH:mm:ss');
  return new Promise((resolve, reject) => {
    let sql = `SELECT id FROM tbt.news WHERE url = ?`;
    mysql.query(sql, [url], function (err, result) {
      if (err) {
        reject('error from checking url query')
        console.log(t, 'Error from checkUrl', err)
      }
      if (result) {
        resolve(result)
      }
    })
  })
}

function getDbUrl(media) {
  let t = moment().format('YYYY-MM-DD-HH:mm:ss');
  return new Promise((resolve, reject) => {
    mysql.query(`SELECT url FROM tbt.news WHERE media = ? FOR UPDATE`, [media], function (err, result) {
      if (err) {
        console.log(t, 'Error from getDbUrl', err);
      }
      let urls = [];
      for (let i = 0; i < result.length; i++) {
        urls.push(result[i].url);
      }
      resolve(urls)
    })
  })
}

function insert(data) {
  let media = data.media;
  let date = data.date;
  let url = data.url;
  let title = data.title;
  let author = data.author;
  let article = data.article;
  let tokenize = data.tokenize;
  let score = data.score;
  let magnitude = data.magnitude;
  let keywords = data.keyword;
  let t = moment().format('YYYY-MM-DD-HH:mm:ss');

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
          let newsId
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
                  let reporterId = await getReporterId(connect, author[i], media)
                  await insertReporterNews(connect, reporterId, newsId);
                }
              } catch (err) {
                console.log(t, err)
                connect.rollback(function () {
                  connect.release();
                });
              }
            })
            .then(() => {
              connect.commit(function (err) {
                if (err) {
                  console.log(t, 'err from commit', err)
                  connect.rollback(function () {
                    connect.release();
                  });
                }
                console.log(t, ' Success message from adding news: ', media, ' ', title);
                resolve();
                connect.release();
              });
            })
        } catch (err) {
          console.log(t, media, 'Error from transaction', err)
          connect.rollback(function () {
            connect.release();
          });
          throw err.message
        }
      })
    })
  })
}

module.exports = {
  insertNews: insertNews,
  insertArticle: insertArticle,
  insertKeyword: insertKeyword,
  getReporterId: getReporterId,
  insertReporterNews: insertReporterNews,
  checkUrl: checkUrl,
  getDbUrl: getDbUrl,
  insert: insert
};
