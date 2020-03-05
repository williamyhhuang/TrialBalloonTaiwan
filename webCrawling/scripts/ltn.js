require('dotenv').config();
const email = process.env.EMAIL;
const request = require('request');
const cheerio = require('cheerio');
const moment = require('moment');
const func = require('./webCrawler/webCrawler_func');
const db = require('./webCrawler/webCrawler_db');
const nodejieba = require("nodejieba");
const cityList = require('./webCrawler/localName');
const exceptKeywords = require('./webCrawler/exceptKeywords');
nodejieba.load({ userDict: 'scripts/similarity/dict2.txt' });

// 分析新聞
function ltn(url) {
  let t = moment().format('YYYY-MM-DD-HH:mm:ss');
  return new Promise((resolve, reject) => {
    request(url, async (err, response, body) => {
      if (err) {
        reject(err);
      };
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
        let authors = await func.ltnSelectAuthor(cityList, article);
        authors = authors.split('、');
        for (let i = 0; i < authors.length; i++) {
          if (authors[i].length >= 4) {
            authors[i] = await func.ltnSelectAuthor(cityList, authors[i]);
          }
        }

        let analyzeArticleResult = await func.analyzeArticle(article);
        let keywords = await func.analyzeEntities(article);
        let score = analyzeArticleResult.score;
        let magnitude = analyzeArticleResult.magnitude;
        //剔除不必要關鍵字
        func.deleteKeywords(keywords, exceptKeywords, cityList);
        let tokenize = nodejieba.cut(article);
        tokenize = tokenize.toString();

        resolve({
          media: 'ltn',
          url: url,
          date: date,
          title: title,
          author: authors,
          article: article,
          tokenize: tokenize,
          score: score,
          magnitude: magnitude,
          keyword: keywords
        });

      } catch (err) {
        console.log(t, 'Error from ltn', err)
      }
    }) // end of request
  })
}
// 處理爬歷史新聞用
async function crawler(host, startTime, endTime) {
  let t = moment().format('YYYY-MM-DD-HH:mm:ss');
  try {
    let page = 1;
    let enough = false;
    let dbUrls = await db.getDbUrl('ltn');
    setTimeout(async function () {
      do {
        let links = await func.getLtnUrl(host, page, startTime, endTime);

        if (links == false) {
          enough = true;
        } else {
          // 消除重複的連結和空字串
          links = new Set(links);
          links = [...links];
          links.filter(ele => ele != '');
          // 若DB已有該新聞，則刪除該連結
          for (let i = 0; i < dbUrls.length; i++) {
            let index = links.indexOf(dbUrls[i]);
            if (index >= 0) {
              links.splice(index, 1)
            }
          }
          // 如果連結長度為零，則沒有新聞要新增
          if (links.length == 0) {
            console.log('In page ', i, 'there is no ltn news has to be added.')
            page += 1;
            continue;
          }
          // 將新增的新聞連結存進 dbUrls，待後續新聞比對是否重複
          for (let i = 0; i < links.length; i++) {
            dbUrls.push(links[i]);
          }
          // 將所有要新增的新聞拆成小包，先新增放新聞的空矩陣
          let newsDataPromise = [];
          for (let i = 0; i < (Math.floor((links.length) / 20) + 1); i++) {
            newsDataPromise[i] = [];
          }
          // 將新聞分裝到各個小包
          for (let i = 0; i < links.length; i++) {
            let index = Math.floor(i / 20);
            newsDataPromise[index].push(ltn(links[i]));
          }
          // 執行各小包的新聞新增
          for (let j = 0; j < newsDataPromise.length; j++) {
            console.log('ltn all total length', newsDataPromise.length, 'now is: ', j + 1)
            await func.execute(newsDataPromise[j]);
          }
          page = page + 1;
        }
      } while (enough == false)
    }, 60000 * 2)
  } catch (err) {
    console.log(t, 'Err from ltn crawler', err);
    func.sendEmail(email, err);
  }
}
// 爬歷史新聞
async function webCrawlingAll(host, start, end) {
  let date = moment().format('YYYY-MM-DD-HH:mm:ss');
  try {
    console.log(date, 'Ltn webCrawlingAll start from ', start + 'to ' + end)
    let startTime = new Date(start).getTime();
    let endTime = new Date(end).getTime()
    let period = 2629800000 * 3; // 三個月為間距
    let duration = endTime - startTime;
    let t = Math.floor(duration / period)

    // 因自由時報有查詢期間三個月的限制，所以要拆開來新增
    let time = []
    time[0] = start;
    if (t == 0) {
      time.push(end) //所有搜尋的時間點陣列排序
    } else {
      for (let i = 0; i < t; i++) {
        let startTime = new Date(time[i]).getTime()
        let endTime = startTime + period;
        let end = new Date(endTime)
        end = end.getFullYear() + '-' + (end.getMonth() + 1) + '-' + end.getDate()
        time.push(end)
      }
      time.push(end) //所有搜尋的時間點陣列排序
    }

    for (let t = 0; t < time.length - 1; t++) {
      console.log('start', time[t], 'end', time[t + 1]);
      await crawler(host, time[t], time[t + 1]);
    }
  } catch (err) {
    console.log(t, 'Err from ltn webCrawlingAll', err);
    func.sendEmail(email, err);
  }
}
// 爬近期新聞
async function webCrawingNew(host) {
  let t = moment().format('YYYY-MM-DD-HH:mm:ss');
  try {
    console.log(t, 'Ltn webCrawlingNew start')
    let links = await func.getLtnUrlNew(host);
    let dbUrls = await db.getDbUrl('ltn');

    // 消除重複的連結和空字串
    links = new Set(links);
    links = [...links];
    links.filter(ele => ele != '');

    // 若DB已有該新聞，則刪除該連結
    for (let i = 0; i < dbUrls.length; i++) {
      let index = links.indexOf(dbUrls[i]);
      if (index >= 0) {
        links.splice(index, 1)
      }
    }
    // 如果連結長度為零，則沒有新聞要新增
    if (links.length == 0) {
      console.log('In page ', i, 'there is no ltn news has to be added.')
      return;
    }
    // 將新增的新聞連結存進 dbUrls，待後續新聞比對是否重複
    for (let i = 0; i < links.length; i++) {
      dbUrls.push(links[i]);
    }
    // 將所有要新增的新聞拆成小包，先新增放新聞的空矩陣
    let newsDataPromise = [];
    for (let i = 0; i < (Math.floor((links.length) / 20) + 1); i++) {
      newsDataPromise[i] = [];
    }
    // 將新聞分裝到各個小包
    for (let i = 0; i < links.length; i++) {
      let index = Math.floor(i / 20);
      newsDataPromise[index].push(ltn(links[i]));
    }
    // 執行各小包的新聞新增
    for (let j = 0; j < newsDataPromise.length; j++) {
      console.log('Ltn news has', newsDataPromise.length, 'set, now is: ', j + 1)
      await func.execute(newsDataPromise[j]);
    }
  } catch (err) {
    console.log(t, 'Error from webCrawlingNew', err)
    func.sendEmail(email, err);
  }
}

module.exports = {
  all: webCrawlingAll,
  new: webCrawingNew
}
