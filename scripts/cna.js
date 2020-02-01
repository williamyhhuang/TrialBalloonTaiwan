const request = require('request');
const cheerio = require('cheerio');
const mysql = require('../util/mysqlcon');
const func = require('./webCrawler/webCrawler_func');
const db = require('./webCrawler/webCrawler_db');

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
];
let exceptKeywords = [
  '中央社',
  '中常委',
  '中時電子報',
  'CTWANT'
]

function cna(url) {
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

      // 新增至資料庫
      mysql.beginTransaction(async function (err) {
        if (err) {
          throw err;
        }
        try {
          let newsId
          await db.insertNews('cna', date, title, url, score, magnitude)
            .then(async (newsTestResult) => {
              newsId = newsTestResult.newsId;
              await db.insertArticle(article, url);
            })
            .then(async () => {
              for (let i = 0; i < keywords.length; i++) {
                await db.insertKeyword(keywords[i], newsId);
              }
            })
            .then(async () => {
              for (let i = 0; i < author.length; i++) {
                author[i] = author[i].trim();
                let reporterId = await db.getReporterId(author[i])
                await db.insertReporterNews(reporterId, newsId);
              }
            })
            .then(() => {
              mysql.commit(function (err) {
                if (err) {
                  console.log('err from commit')
                  mysql.rollback();
                  throw err
                }
                console.log('success message from adding news: ', title);
              });
            })

        } catch (e) {
          console.log('error from transaction')
          mysql.rollback();
          throw e.message
        }
      })
    } catch (e) {
      console.log(e)
    }
  }) // end of request
}

async function crawler(host, number) {
  try {
    let urls = await func.getCnaUrl(host, number);
    for (let i = 0; i < urls.length; i++) {
      let checkUrlResult = await db.checkUrl(urls[i]);
      if (checkUrlResult.length == 0) {
        cna(urls[i]);
      } else {
        console.log('this news has exsist: ', urls[i])
      }
    }
  } catch (e) {
    console.log('err from cna crawler', e)
  }
}

function webCrawling(host) {
  for (let i = 0; i < 1; i++) {
    crawler(host, i);
  }
}

module.exports = webCrawling