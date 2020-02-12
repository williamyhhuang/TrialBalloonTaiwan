var express = require('express');
var request = require('request');
var cheerio = require('cheerio');
const func = require('./webCrawler/webCrawler_func');
const mysql = require('../util/mysqlcon')
const db = require('./webCrawler/webCrawler_db');
var router = express.Router();

router.get('/', function (req, res, next) {
  let media = req.headers.media;
  let url = req.headers.url;
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

  if (media == 'chtimes') {
    request(url, async (err, response, body) => {
      if (err) throw err;
      try {

        const $ = cheerio.load(body);
        // 新聞標題
        let title = $('.article-header .article-title').text();
        // 新聞日期
        let date = $('.meta-info-wrapper .meta-info time .date').text();
        // 新聞時間
        let time = $('.meta-info-wrapper .meta-info time .hour').text();
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

        // 新增至資料庫
        mysql.getConnection(function (err, connect) {
          if (err) {
            res.status(500).send('Error from adding news');
            console.log('Error from getConnection', err)
            connect.rollback(function () {
              connect.release();
            });
          }
          connect.beginTransaction(async function (err) {
            if (err) {
              res.status(500).send('Error from adding news');
              console.log('Error from transaction', err)
              connect.rollback(function () {
                connect.release();
              });
            } else {
              // 新增新聞資料
              let newsId = await db.insertNews('chtimes', date, title, url, score, magnitude);
              // 新增新聞文章
              db.insertArticle(article, url);
              // 新增關鍵字
              for (let i = 0; i < keywords.length; i++) {
                db.insertKeyword(keywords[i], newsId)
              }
              // 搜尋/新增記者id
              let reporterIds = [];
              for (let i = 0; i < author.length; i++) {
                let reporterId;
                author[i] = author[i].trim();
                let selectReporterResult = await db.selectReporter(author[i])
                if (selectReporterResult.length == 0) {
                  reporterId = await db.insertReporter(author[i]);
                  reporterIds.push(reporterId);
                } else {
                  reporterId = selectReporterResult;
                  reporterIds.push(reporterId);
                }
                // 新增記者與新聞間之關係
                db.insertReporterNews(reporterId, newsId)
              }

              connect.commit(function (err) {
                if (err) {
                  res.status(500).send('Error from adding news');
                  console.log('Error from commit', err)
                  connect.rollback(function () {
                    connect.release();
                  });
                } else {
                  console.log('Success message from adding news');
                  let result = {
                    url: url,
                    date: date,
                    time: time,
                    author: author,
                    title: title,
                    article: article
                  };

                  res.json(result)
                }
              });
            }
          })
        })
      } catch (e) {
        console.log(e)
      }
    }) // end of request
  } else {
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
        mysql.getConnection(function (err, connect) {
          if (err) {
            res.status(500).send('Error from adding news');
            console.log('Error from getConnection', err)
            connect.rollback(function () {
              connect.release();
            });
          }
          connect.beginTransaction(async function (err) {
            if (err) {
              res.status(500).send('Error from adding news');
              console.log('Error from transaction', err)
              connect.rollback(function () {
                connect.release();
              });
            } else {
              // 新增新聞資料
              let newsId = await db.insertNews('cna', date, title, url, score, magnitude);
              // 新增新聞文章
              db.insertArticle(article, url);
              // 新增關鍵字
              for (let i = 0; i < keywords.length; i++) {
                db.insertKeyword(keywords[i], newsId)
              }
              // 搜尋/新增記者id
              let reporterIds = [];
              for (let i = 0; i < author.length; i++) {
                let reporterId;
                let selectReporterResult = await db.selectReporter(author[i])
                if (selectReporterResult.length == 0) {
                  reporterId = await db.insertReporter(author[i]);
                  reporterIds.push(reporterId);
                } else {
                  reporterId = selectReporterResult;
                  reporterIds.push(reporterId);
                }
                // 新增記者與新聞間之關係
                db.insertReporterNews(reporterId, newsId)
              }

              connect.commit(function (err) {
                if (err) {
                  res.status(500).send('Error from adding news');
                  console.log('Error from commit', err)
                  connect.rollback(function () {
                    connect.release();
                  });
                } else {
                  console.log('Success message from adding news');
                  let result = {
                    url: url,
                    date: date,
                    time: hour,
                    author: author,
                    title: title,
                    article: article
                  };

                  res.json(result)
                }
              });
            }
          })
        })
      } catch (e) {
        console.log(e)
      }
    }) // end of request
  } // end of cna
});

module.exports = router;