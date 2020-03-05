require('dotenv').config();
const email = process.env.EMAIL;
const request = require('request');
const cheerio = require('cheerio');
const func = require('./webCrawler/webCrawler_func');
const db = require('./webCrawler/webCrawler_db');
const nodejieba = require("nodejieba");
const nodemailer = require('nodemailer');
const cityList = require('./webCrawler/localName');

nodejieba.load({ userDict: 'scripts/similarity/dict2.txt' });

let exceptKeywords = [
  '中央社',
  '中常委',
  '中時電子報',
  'CTWANT'
]

function chtimes(url) {
  let t = moment().format('YYYY-MM-DD-HH:mm:ss');
  return new Promise((resolve, reject) => {
    request(url, async (err, response, body) => {
      if (err) {
        reject(err);
      }
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
        let tokenize = nodejieba.cut(article);
        tokenize = tokenize.toString();

        resolve({
          media: 'chtimes',
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
      } catch (err) {
        console.log(t, 'Error from chtimes', err)
      }
    })
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

async function webCrawlingNew(host) {
  let t = moment().format('YYYY-MM-DD-HH:mm:ss');
  try {
    console.log(t, 'Chtimes webCrawlingNew start')
    let dbUrls = await db.getDbUrl('chtimes');
    for (let i = 1; i < 11; i++) {
      console.log('Chtimes webCrawlingNew in page ' + i);
      let links = await func.getChtimesUrl(host, i);

      // 消除重複的連結和空字串
      links = new Set(links);
      links = [...links];
      links.filter(ele => ele != 'https://www.chinatimes.com');
      for (let i = 0; i < links.length; i++) {
        let index = links.indexOf('');
        if (index >= 0) {
          links.splice(index, 1);
        }
      }
      // 若DB已有該新聞，則刪除該連結
      for (let i = 0; i < dbUrls.length; i++) {
        let index = links.indexOf(dbUrls[i]);
        if (index >= 0) {
          links.splice(index, 1)
        }
      }
      // 如果連結長度為零，則沒有新聞要新增
      if (links.length == 0) {
        console.log('In page ', i, 'there is no chtimes news has to be added.')
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
        newsDataPromise[index].push(chtimes(links[i]));
      }
      // 執行各小包的新聞新增
      for (let j = 0; j < newsDataPromise.length; j++) {
        console.log('Chtimes news has', newsDataPromise.length, 'set, now is: ', j + 1)
        await func.execute(newsDataPromise[j]);
      }
    }
  } catch (err) {
    console.log(t, 'Error from chtimes webCrawlingNew', err);
    func.sendEmail(email, err);
  }
}

async function webCrawlingAll(host) {
  let t = moment().format('YYYY-MM-DD-HH:mm:ss');
  try {
    let dbUrls = await db.getDbUrl('chtimes');
    for (let i = 1; i < 26; i++) {
      console.log(t, 'Chtimes webCrawlingAll in page ' + i);

      let links = await func.getChtimesUrl(host, i);

      // 消除重複的連結和空字串
      links = new Set(links);
      links = [...links];
      links.filter(ele => ele != '');
      links.filter(ele => ele != 'https://www.chinatimes.com');

      for (let i = 0; i < dbUrls.length; i++) {
        let index = links.indexOf(dbUrls[i]);
        if (index >= 0) {
          links.splice(index, 1)
        }
      }
      // 如果連結長度為零，則沒有新聞要新增
      if (links.length == 0) {
        console.log('In page ', i, 'there is no chtimes news has to be added.')
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
        newsDataPromise[index].push(chtimes(links[i]));
      }
      // 執行各小包的新聞新增
      for (let j = 0; j < newsDataPromise.length; j++) {
        console.log('Chtimes news has', newsDataPromise.length, 'set, now is: ', j + 1)
        await func.execute(newsDataPromise[j]);
      }
    }
  } catch (err) {
    console.log(t, 'Error from chtimes webCrawlingAll', err);
    func.sendEmail(email, err);
  }
}

module.exports = {
  all: webCrawlingAll,
  new: webCrawlingNew
}