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

function ltn(url) {
  request(url, async (err, response, body) => {
    if (err) throw err;
    try {
      const $ = cheerio.load(body);
      $('.appE1121').remove();
      let time = $('.time').text();
      time = time.trim().split(' ');
      // 新聞標題
      let title = $('.whitecon h1').text();
      // 新聞日期
      let date = time[0];
      // 新聞時間
      let hour = time[1];
      // 新聞本體
      let articleLength = $('.whitecon p').length;
      let article = $('.whitecon p').slice(1, articleLength - 1).text();
      // 新聞記者
      let string = article.substring(1, 20);
      let author = await func.selectAuthor(cityList, string);
      author = author.split('、');
      let authors = [];
      for (let i = 0; i < author.length; i++) {
        let name = author[i].split('');
        if (name.indexOf('／') > 0) {
          name.pop();
        }
        name = name.join('');
        authors.push(name);
      }

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
          await db.insertNews('ltn', date, title, url, score, magnitude)
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
              for (let i = 0; i < authors.length; i++) {
                authors[i] = authors[i].trim();
                let reporterId = await db.getReporterId(authors[i])
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

async function crawler(host, startTime, endTime) {
  try {
    let page = 1;
    let enough = false;
    do {
      let urls = await func.getLtnUrl(host, page, startTime, endTime);

      if (urls == false) {
        enough = true;
      } else {
        for (let i = 0; i < urls.length; i++) {
          if (urls[i] != '') {
            let checkUrlResult = await db.checkUrl(urls[i]);
            if (checkUrlResult.length == 0) {
              ltn(urls[i]);
            } else {
              console.log('this news has exsist: ', urls[i])
            }
          }
        }
        page = page + 1;
      }
    } while (enough == false)
  } catch (e) {
    console.log('err from ltn crawler', e)
  }
}

function webCrawlingAll(host, s, e) {
  let start = s;
  let end = e;

  let startTime = new Date(start).getTime();
  let endTime = new Date(end).getTime()
  let period = 2629800000 * 3; // three month
  let duration = endTime - startTime;
  let t = Math.floor(duration / period)

  let time = []
  time[0] = start;

  if (t == 0) {
    time.push(end) //所有搜尋的時間點陣列
  } else {
    for (let i = 0; i < t; i++) {
      let startTime = new Date(time[i]).getTime()
      let endTime = startTime + period;
      let end = new Date(endTime)
      end = end.getFullYear() + '-' + (end.getMonth() + 1) + '-' + end.getDate()
      time.push(end)
    }
    time.push(end) //所有搜尋的時間點陣列
  }

  for (let t = 0; t < time.length - 1; t++) {
    console.log('start', time[t], 'end', time[t + 1]);
    crawler(host, time[t], time[t + 1]);
  }
}

async function webCrawingNew(host) {
  try{
    const urls = await func.getLtnUrlNew(host);
    for (let i = 0; i < urls.length; i++) {
      let checkUrlResult = await db.checkUrl(urls[i]);
      if (checkUrlResult.length == 0) {
        ltn(urls[i]);
      } else {
        console.log('this news has exsist: ', urls[i])
      }
    }
  }catch(e){
    console.log(e)
  }
}

module.exports = {
  all: webCrawlingAll,
  new: webCrawingNew
}