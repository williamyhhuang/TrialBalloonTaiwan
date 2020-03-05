const mysql = require('../util/mysqlcon');
const nodejieba = require('nodejieba');
const moment = require('moment');
nodejieba.load({ userDict: 'scripts/similarity/dict2.txt' });


function getArticle() {
  return new Promise((resolve, reject) => {
    let sql = `SELECT * FROM article;`;
    mysql.query(sql, function (err, result) {
      if (err) {
        reject('Error from getting article of updateTokenize.js');
      }
      resolve(result);
    })
  })
}

async function updateTokenize() {
  let t = moment().format('YYYY-MM-DD-HH:mm:ss');
  try {
    let getArticleResult = await getArticle();

    // 更新新聞斷詞
    for (let i = 0; i < getArticleResult.length; i++) {
      let tokenize = nodejieba.cut(getArticleResult[i].article);
      tokenize = tokenize.toString();
      getArticleResult[i].tokenize = tokenize;
    }

    // 更新資料庫的新聞斷詞
    for (let i = 0; i < getArticleResult.length; i++) {
      let tokenize = getArticleResult[i].tokenize;
      let id = getArticleResult[i].id;
      let news_url = getArticleResult[i].news_url;
      let sql = `UPDATE article SET tokenize=? WHERE id=? AND news_url=?`;

      mysql.query(sql, [tokenize, id, news_url], function (err, result) {
        if (err) {
          console.log(t, 'Error from updating tokenize', err)
        } else {
          if (i == getArticleResult.length - 1) {
            console.log('update tokenize is done');
          }
        }
      })
    }

  } catch (e) {
    console.log(e)
  }
}

module.exports = updateTokenize;
