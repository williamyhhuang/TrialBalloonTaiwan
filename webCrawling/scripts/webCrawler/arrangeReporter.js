/* eslint-disable indent */
/* eslint-disable prefer-promise-reject-errors */
/* eslint-disable max-len */
/* eslint-disable require-jsdoc */
// 如果資料庫的記者名字因為該記者在新增文章時的人為錯誤
// 可以先砍掉資料庫的 reporter 及 reporter_has_news 的兩張表
// 用此方程式重建 reporter 及 reporter_has_news 兩張表
const mysql = require('../../util/mysqlcon');
const nodejieba = require('nodejieba');
const func = require('./webCrawler_func');
const cityList = require('./localName');
const request = require('request');
const cheerio = require('cheerio');
nodejieba.load({ userDict: './scripts/similarity/dict2.txt' });

async function updateReporter() {
  try {
    await ltnUpdate()
      .then(async () => {
        console.log('ltn reporter update is done');
        return cnaUpdate();
      })
      .then(async () => {
        console.log('cna reporter update is done');
        return chtimesUpdate();
      })
      .then(() => {
        console.log('chtimes reporter update is done');
        console.log('all reporter update is done');
      });
  } catch (e) {
    console.log(e);
  }
}

updateReporter();
// module.exports = updateReporter;


// / 以下為用到的function ///

function ltnUpdate() {
  return new Promise(async (resolve, reject) => {
    const sqlLtn = `SELECT n.id,n.media,n.url,a.article FROM news AS n, article AS a WHERE n.media='ltn' AND n.url=a.news_url`;
    const ltnResult = await dataQuery(sqlLtn);

    for (let i = 0; i < ltnResult.length; i++) {
      const id = ltnResult[i].id;
      const media = ltnResult[i].media;
      const article = ltnResult[i].article;
      const result = await ltn(id, article);
      const data = {
        id: id,
        media: media,
        author: result.author,
      };

      await update(data);
    }

    resolve();
  });
}

function cnaUpdate() {
  return new Promise(async (resolve, reject) => {
    const sqlCna = `SELECT n.id,n.media,n.url,a.article FROM news AS n, article AS a WHERE n.media='cna' AND n.url=a.news_url`;
    const cnaResult = await dataQuery(sqlCna);

    for (let i = 0; i < cnaResult.length; i++) {
      const id = cnaResult[i].id;
      const media = cnaResult[i].media;
      const article = cnaResult[i].article;
      const result = await cna(id, article);
      const data = {
        id: id,
        media: media,
        author: result.author,
      };

      await update(data);
    }

    resolve();
  });
}

function chtimesUpdate() {
  return new Promise(async (resolve, reject) => {
    const sqlChtimes = `SELECT n.id,n.media,n.url FROM news AS n WHERE n.media='chtimes'`;
    const chtimesResult = await dataQuery(sqlChtimes);

    for (let i = 0; i < chtimesResult.length; i++) {
      const id = chtimesResult[i].id;
      const media = chtimesResult[i].media;
      const url = chtimesResult[i].url;
      const result = await chtimes(url);
      const data = {
        id: id,
        media: media,
        author: result.author,
      };

      await update(data);
    }

    resolve();
  });
}

function getReporterId(connect, author, media) {
  return new Promise((resolve, reject) => {
    const selectReporterSql = `SELECT id FROM reporter WHERE name = '${author}'`;
    connect.query(selectReporterSql, function (selectReporterErr, selectReporterResult) {
      if (selectReporterErr) {
        console.log(selectReporterErr);
        reject(selectReporterErr);
      }
      console.log('select reporter', selectReporterResult);
      if (selectReporterResult.length > 0) {
        const reporterId = selectReporterResult[0].id;
        resolve(reporterId);
      } else {
        const insertReporterSql = `INSERT INTO tbt.reporter SET ?`;
        const insertReporterPost = {
          name: author,
          media: media,
        };
        connect.query(insertReporterSql, insertReporterPost, function (insertReporterErr, insertReporterResult) {
          if (insertReporterErr) {
            reject(insertReporterErr);
          }
          console.log('insert reporter', insertReporterResult);
          if (insertReporterResult == undefined) {
            reject('err from getting reporterId');
            return;
          }
          const reporterId = insertReporterResult.insertId;
          resolve(reporterId);
        });
      }
    });
  });
}

function insertReporterNews(connect, reporterId, newsId) {
  return new Promise((resolve, reject) => {
    const results = [];
    // 新增記者與新聞間之關係
    const insertReporterNewsSql = `INSERT INTO tbt.reporter_has_news SET ?`;
    const insertReporterNewsPost = {
      reporter_id: reporterId,
      news_id: newsId,
    };
    connect.query(insertReporterNewsSql, insertReporterNewsPost, function (insertReporterNewsErr, insertReporterNewsResult) {
      if (insertReporterNewsErr) {
        console.log(insertReporterNewsErr);
        reject(insertReporterNewsErr);
      }
      console.log('insert reporter news', insertReporterNewsResult);
      results.push(true);
    });
    resolve(true);
  });
}

function update(data) {
  const id = data.id;
  const media = data.media;
  const author = data.author;

  return new Promise((resolve, reject) => {
    // 新增至資料庫
    mysql.getConnection(function (err, connect) {
      if (err) {
        console.log(err);
        connect.release();
      }
      connect.beginTransaction(async function (err) {
        if (err) {
          console.log('err from beginTransaction', err);
        }
        try {
          for (let i = 0; i < author.length; i++) {
            author[i] = author[i].trim();
            const reporterId = await getReporterId(connect, author[i], media);
            await insertReporterNews(connect, reporterId, id);
          }
          connect.commit(function (err) {
            if (err) {
              console.log('err from commit');
              connect.rollback(function () {
                connect.release();
              });
              console.log('err from commit', err);
            }
            console.log('success message from adding news: ', id);
            resolve();
            connect.release();
          });
        } catch (e) {
          console.log('error from transaction', e);
          connect.rollback(function () {
            connect.release();
          });
          throw e.message;
        }
      });
    });
  });
}

function dataQuery(sql) {
  return new Promise((resolve, reject) => {
    mysql.query(sql, function (err, result) {
      if (err) {
        console.log(err);
      }
      resolve(result);
    });
  });
}

function chtimes(url) {
  if (url.indexOf('https://www.chinatimes.com') < 0) {
    url = 'https://www.chinatimes.com' + url;
  }
  return new Promise((resolve, reject) => {
    request(url, async (err, response, body) => {
      if (err) throw err;
      try {
        const $ = cheerio.load(body);
        // 新聞記者
        let author = $('.author').text().trim();
        author = author.split('、');

        resolve({
          media: 'chtimes',
          author: author,
        });
      } catch (e) {
        console.log('error from request', e);
      }
    });
  });
}

function cna(id, article) {
  return new Promise(async (resolve, reject) => {
    try {
      // 新聞記者
      const string = article.substring(1, 30);
      let author = await func.cnaSelectAuthor(cityList, string);
      author = await func.cnaSelectAuthor(cityList, string);
      author = author.split('、');
      const number = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
      for (let i = 0; i < author.length; i++) {
        if (author[i].length <= 1) {
          author[i] = 'cna';
        }
        if (author[i].length >= 4) {
          author[i] = await func.cnaSelectAuthor(cityList, author[i]);
        }
        for (let j = 0; j < number.length; j++) {
          const index = author[i].indexOf(number[j]);
          if (index >= 0) {
            author[i] = author[i].slice(0, index);
          }
        }
      }
      console.log('cna reporter data has been updated', id, author);
      resolve({
        media: 'cna',
        author: author,
      });
    } catch (e) {
      console.log(e);
    }
  });
}

function ltn(id, article) {
  return new Promise(async (resolve, reject) => {
    try {
      // 新聞記者
      let authors = await func.ltnSelectAuthor(cityList, article);
      authors = authors.split('、');
      for (let i = 0; i < authors.length; i++) {
        if (authors[i].length <= 1) {
          authors[i] = 'ltn';
        } else if (authors[i].length >= 4) {
          authors[i] = await func.ltnSelectAuthor(cityList, authors[i]);
        }
      }
      console.log('ltn reporter data has been updated', id, authors);
      resolve({
        media: 'ltn',
        author: authors,
      });
    } catch (e) {
      console.log('error from function ltn', e);
    }
  });
}
