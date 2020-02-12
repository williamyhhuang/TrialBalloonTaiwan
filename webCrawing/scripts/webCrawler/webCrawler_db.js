const mysql = require('../../util/mysqlcon.js');


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
      news_id: newsId
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

function getReporterId(connect, author) {
  return new Promise((resolve, reject) => {
    let selectReporterSql = `SELECT id FROM reporter WHERE name = '${author}'`;
    connect.query(selectReporterSql, function (selectReporterErr, selectReporterResult) {
      if (selectReporterErr) {
        reject(selectReporterErr)
      }
      if (selectReporterResult.length > 0) {
        let reporterId = selectReporterResult[0].id
        resolve(reporterId)
      } else {
        let insertReporterSql = `INSERT INTO tbt.reporter SET ?`;
        let insertReporterPost = {
          name: author
        }
        connect.query(insertReporterSql, insertReporterPost, function (insertReporterErr, insertReporterResult) {
          if (insertReporterErr) {
            reject(insertReporterErr)
          }

          if (insertReporterResult == undefined) {
            reject('err from getting reporterId');
            return;
          }
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
  return new Promise((resolve, reject) => {
    let sql = `SELECT id FROM tbt.news WHERE url = '${url}'`;
    mysql.query(sql, function (err, result) {
      if (err) {
        reject('error from checking url query')
        console.log('err from checkUrl', err)
      }
      if (result) {
        resolve(result)
      }
    })
  })
}

function getDbUrl(media) {
  return new Promise((resolve, reject) => {
    mysql.query(`SELECT url FROM tbt.news WHERE media = '${media}' FOR UPDATE`, function (err, result) {
      if (err) {
        console.log('error from getDbUrl',err);
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

  return new Promise((resolve, reject) => {
    // 新增至資料庫
    mysql.getConnection(function (err, connect) {
      if (err) {
        res.send(err);
        connect.rollback(function () {
          connect.release();
        });
      }
      connect.beginTransaction(async function (err) {
        if (err) {
          console.log('err from beginTransaction',err);
        }
        try {
          let newsId
          await insertNews(connect, media, date, title, url, score, magnitude)
            .then(async (newsTestResult) => {
              try{
                newsId = newsTestResult.newsId;
                await insertArticle(connect, article, url, tokenize);
                for (let i = 0; i < keywords.length; i++) {
                  await insertKeyword(connect, keywords[i], newsId);
                }
                for (let i = 0; i < author.length; i++) {
                  author[i] = author[i].trim();
                  let reporterId = await getReporterId(connect, author[i])
                  await insertReporterNews(connect, reporterId, newsId);
                } 
              }catch(e){
                console.log(e)
              }
            })
            // .then(async () => {
            //   try{
            //     for (let i = 0; i < keywords.length; i++) {
            //       await insertKeyword(connect, keywords[i], newsId);
            //     }
            //   }catch(e){
            //     console.log(e)
            //   }
            // })
            // .then(async () => {
            //   try{
            //       for (let i = 0; i < author.length; i++) {
            //         author[i] = author[i].trim();
            //         let reporterId = await getReporterId(connect, author[i])
            //         await insertReporterNews(connect, reporterId, newsId);
            //       }                
            //   }catch(e){
            //     console.log(e)
            //   }
            // })
            .then(() => {
              connect.commit(function (err) {
                if (err) {
                  console.log('err from commit')
                  connect.rollback(function () {
                    connect.release();
                  });
                  console.log('err from commit',err)
                }
                console.log('success message from adding news: ', title);
                resolve();
                connect.release();
              });
            })
        } catch (e) {
          console.log('error from transaction',e)
          connect.rollback(function () {
            connect.release();
          });
          throw e.message
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
