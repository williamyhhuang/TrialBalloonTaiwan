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

function chtimes(url) {
  if (url.indexOf('https://www.chinatimes.com') < 0) {
    url = 'https://www.chinatimes.com' + url;
  }

  request(url, async (err, response, body) => {
    if (err) throw err;
    try {
      const $ = cheerio.load(body);
      // 新聞標題
      let title = $('.article-header .article-title').text();
      // 新聞日期
      let date = $('.meta-info-wrapper .meta-info time .date').text();
      // 新聞時間
      let hour = $('.meta-info-wrapper .meta-info time .hour').text();
      // 新聞記者
      let author = $('.author').text().trim();
      author = author.split('、');
      // 新聞本體
      let article = $('.article-body p').text();

      let analyzeArticleResult = await func.analyzeArticle(article);
      let keywords = await func.analyzeEntities(article);
      let score = analyzeArticleResult.score;
      let magnitude = analyzeArticleResult.magnitude;
      //剔除不必要關鍵字
      func.deleteKeywords(keywords, exceptKeywords, cityList);

      mysql.beginTransaction(async function (err) {
        if (err) {
          throw err;
        }
        try {
          let newsId
          await db.insertNews('chtimes', date, title, url, score, magnitude)
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
      console.log('error from request', e)
    }
  })
}

async function crawler(host, number) {
  try {
    let urls = await func.getChtimesUrl(host, number);
    for (let i = 0; i < urls.length; i++) {
      if (urls[i] != '') {
        let checkUrlResult = await db.checkUrl(urls[i]);
        if (checkUrlResult.length == 0) {
          chtimes(urls[i]);
        } else {
          console.log('this news has exsist: ', urls[i])
        }
      }
    }
  } catch (e) {
    console.log('err from crawler', e)
  }
}

function webCrawling(host) {
  for (let i = 1; i < 2; i++) {
    crawler(host, i);
  }
}

module.exports = webCrawling
