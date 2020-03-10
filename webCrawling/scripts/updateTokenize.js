/* eslint-disable require-jsdoc */
const mysql = require('../util/mysqlcon');
const nodejieba = require('nodejieba');
const moment = require('moment');
nodejieba.load({userDict: 'scripts/similarity/dict2.txt'});


function getArticle() {
  return new Promise((resolve, reject) => {
    const sql = `SELECT * FROM article;`;
    mysql.query(sql, function(err, result) {
      if (err) {
        reject(err);
      }
      resolve(result);
    });
  });
}

async function updateTokenize() {
  const t = moment().format('YYYY-MM-DD-HH:mm:ss');
  try {
    const getArticleResult = await getArticle();

    // 更新新聞斷詞
    for (let i = 0; i < getArticleResult.length; i++) {
      let tokenize = nodejieba.cut(getArticleResult[i].article);
      tokenize = tokenize.toString();
      getArticleResult[i].tokenize = tokenize;
    }

    // 更新資料庫的新聞斷詞
    for (let i = 0; i < getArticleResult.length; i++) {
      const tokenize = getArticleResult[i].tokenize;
      const id = getArticleResult[i].id;
      const newsUrl = getArticleResult[i].news_url;
      const sql = `UPDATE article SET tokenize=? WHERE id=? AND news_url=?`;

      mysql.query(sql, [tokenize, id, newsUrl], function(err, result) {
        if (err) {
          console.log(t, 'Error from updating tokenize', err);
        } else {
          if (i == getArticleResult.length - 1) {
            console.log(t, 'Update tokenize is done');
          }
        }
      });
    }
  } catch (err) {
    console.log(err);
  }
}

module.exports = updateTokenize;
