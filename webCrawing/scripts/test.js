const mysql = require('../util/mysqlcon');
const nodejieba = require("nodejieba");
const request = require('request');
const cheerio = require('cheerio');
const func = require('./webCrawler/webCrawler_func');
nodejieba.load({ userDict: 'scripts/similarity/dict.txt' });

let cityList = [
  '台北',
  '新北',
  '桃園',
  '新竹',
  '苗栗',
  '台中',
  '彰化',
  '雲林',
  '嘉義',
  '台南',
  '高雄',
  '屏東',
  '台東',
  '花蓮',
  '宜蘭',
  '香港',
  '華盛頓',
  '洛杉磯',
  '布魯塞爾',
  '東京',
  '多倫多',
  '羅馬',
  '倫敦',
  '舊金山',
];
let exceptKeywords = [
  '中央社',
  '中常委',
  '中時電子報',
  'CTWANT'
]

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
        console.log(insertNewsErr)
        reject(insertNewsErr)
      }
      console.log('insert news', insertNewsResult)
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
        console.log(insertArticleErr)
        reject(insertArticleErr)
      }
      console.log('article', insertArticleResult)
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
        console.log(insertKeywordsErr);
        reject(insertKeywordsErr)
      }
      console.log('key', insertKeywordsResult)
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
        console.log(selectReporterErr)
        reject(selectReporterErr)
      }
      console.log('select reporter', selectReporterResult)
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
          console.log('insert reporter', insertReporterResult)
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
        console.log(insertReporterNewsErr);
        reject(insertReporterNewsErr)
      }
      console.log('insert reporter news', insertReporterNewsResult)
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
        console.log('error from getDbUrl', err);
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
          console.log('err from beginTransaction', err);
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
                  let reporterId = await getReporterId(connect, author[i])
                  await insertReporterNews(connect, reporterId, newsId);
                }
              } catch (e) {
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
                  console.log('err from commit', err)
                }
                console.log('success message from adding news: ', title);
                resolve();
                connect.release();
              });
            })
        } catch (e) {
          console.log('error from transaction', e)
          connect.rollback(function () {
            connect.release();
          });
          throw e.message
        }
      })
    })
  })
}

function cna(url) {
  return new Promise((resolve, reject) => {
    request(url, async (err, response, body) => {
      if (err) throw err;
      try {
        const $ = cheerio.load(body);
        let time = $('.timeBox .updatetime span').text().split(' ');
        // 新聞標題
        let title = $('.centralContent h1').text();
        // 新聞日期
        let date = time[0];
        // 新聞時間
        let hour = time[1];
        // 新聞本體
        let article = $('.paragraph p').text();
        // 新聞記者
        let string = article.substring(1, 20);
        let author = await func.selectAuthor(cityList, string);
        author = author.split('、');

        let analyzeArticleResult = await func.analyzeArticle(article);
        let keywords = await func.analyzeEntities(article);
        let score = analyzeArticleResult.score;
        let magnitude = analyzeArticleResult.magnitude;
        //剔除不必要關鍵字
        func.deleteKeywords(keywords, exceptKeywords, cityList);
        // 文章分詞
        let tokenize = nodejieba.cut(article);
        tokenize = tokenize.toString();

        resolve({
          media: 'cna',
          url: url,
          date: date,
          title: title,
          author: author,
          article: article,
          tokenize: tokenize,
          score: score,
          magnitude: magnitude,
          keyword: keywords
        });
      } catch (e) {
        console.log(e)
      }
    }) // end of request
  })
}

async function test(url) {
  try {
    let result = await cna(url);
    insert(result);

  } catch (e) {
    console.log(e)
  }
}

async function test2(i) {
  return new Promise((resolve, reject) => {
    console.log('hi hi')
    setTimeout(function () {
      console.log('in test2', i);
      resolve();
    }, 1000)
  })
}

async function execute2() {
  try {
    for (let i = 0; i < 50; i++) {
      await test2(i)
    }
  } catch (e) {
    console.log(e)
  }
}

// let a = [1,1,2,3,4,6,7,7,8,9,""];
//   a = new Set(a);
// a = [...a]
// let c = a.indexOf("");
// if (c>=0){
//   a.splice(c,1);
// }
// console.log(a);


function a1() {
  return new Promise((resolve, reject) => {
    for (let i = 0; i < 10; i++) {
      console.log('a1 ' + i);
    }
    resolve();
  })
}

function a2() {
  return new Promise((resolve, reject) => {
    for (let i = 0; i < 10; i++) {
      console.log('a2 ' + i);
    }
    resolve();
  })
}

function a3() {
  return new Promise((resolve, reject) => {
    for (let i = 0; i < 10; i++) {
      console.log('a3 ' + i);
    }
    resolve();
  })
}

let a4 = async function () {
  try {
    await a1();
    await a2();
    await a3();
    // await a1()
    //   .then(async () => {
    //     await a2()
    //   })
    //   .then(async () => {
    //     await a3()
    //   })
  } catch (e) {
    console.log(e)
  }
}

let t = 0;

function tt(t) {
  return new Promise((resolve, reject)=>{
    for (let i = 0; i < 10; i++) {
      t + i
    }
    resolve(t);
  })
}

async function ttt(t){
  try{
    let result = await tt(t);
    console.log(result);
  }catch(e){

  }
}
console.log(ttt(t));
