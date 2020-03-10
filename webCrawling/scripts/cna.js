/* eslint-disable max-len */
/* eslint-disable require-jsdoc */
require('dotenv').config();
const email = process.env.EMAIL;
const request = require('request');
const cheerio = require('cheerio');
const moment = require('moment');
const func = require('./webCrawler/webCrawler_func');
const db = require('./webCrawler/webCrawler_db');
const nodejieba = require('nodejieba');
const cityList = require('./webCrawler/localName');
const exceptKeywords = require('./webCrawler/exceptKeywords');
nodejieba.load({userDict: 'scripts/similarity/dict2.txt'});

// 分析新聞
function cna(url) {
  const t = moment().format('YYYY-MM-DD-HH:mm:ss');
  return new Promise((resolve, reject) => {
    request(url, async (err, response, body) => {
      if (err) {
        reject(err);
      }
      try {
        const $ = cheerio.load(body);
        const time = $('.timeBox .updatetime span').text().split(' ');
        // 新聞標題
        const title = $('.centralContent h1').text();
        // 新聞日期
        const date = time[0];
        // 新聞本體
        const article = $('.paragraph p').text();
        // 新聞記者
        const string = article.substring(1, 30);
        let author = await func.cnaSelectAuthor(cityList, string);
        author = author.split('、');
        const number = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
        for (let i = 0; i < author.length; i++) {
          if (author[i].length >= 4) {
            author[i] = await func.cnaSelectAuthor(cityList, author[i]);
          }
          for (let j = 0; j < number.length; j++) {
            const index = author[i].indexOf(number[j]);
            if (index >= 0) {
              author[i] = author[i].slice(0, index);
            }
          }
        }

        const analyzeArticleResult = await func.analyzeArticle(article);
        const keywords = await func.analyzeEntities(article);
        const score = analyzeArticleResult.score;
        const magnitude = analyzeArticleResult.magnitude;
        // 剔除不必要關鍵字
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
          keyword: keywords,
        });
      } catch (err) {
        console.log(t, 'Error from cna', err);
      }
    }); // end of request
  });
}
// 爬近期新聞
async function webCrawlingNew(host) {
  const t = moment().format('YYYY-MM-DD-HH:mm:ss');
  try {
    console.log(t, 'Cna webCrawlingNew start');
    const dbUrls = await db.getDbUrl('cna');
    for (let i = 1; i < 6; i++) {
      console.log('Cna webCrawlingNew in page ' + i);
      let links = await func.getCnaUrl(host, i);

      // 消除重複的連結和空字串
      links = new Set(links);
      links = [...links];
      links.filter((ele) => ele != '');
      // 若DB已有該新聞，則刪除該連結
      for (let i = 0; i < dbUrls.length; i++) {
        const index = links.indexOf(dbUrls[i]);
        if (index >= 0) {
          links.splice(index, 1);
        }
      }
      // 如果連結長度為零，則沒有新聞要新增
      if (links.length == 0) {
        console.log('In page ', i, 'there is no cna news has to be added.');
        continue;
      }
      // 將新增的新聞連結存進 dbUrls，待後續新聞比對是否重複
      for (let i = 0; i < links.length; i++) {
        dbUrls.push(links[i]);
      }
      // 將所有要新增的新聞拆成小包，先新增放新聞的空矩陣
      const newsDataPromise = [];
      for (let i = 0; i < (Math.floor((links.length) / 20) + 1); i++) {
        newsDataPromise[i] = [];
      }
      // 將新聞分裝到各個小包
      for (let i = 0; i < links.length; i++) {
        const index = Math.floor(i / 20);
        newsDataPromise[index].push(cna(links[i]));
      }
      // 執行各小包的新聞新增
      for (let j = 0; j < newsDataPromise.length; j++) {
        console.log('Cna news has', newsDataPromise.length, 'set, now is: ', j + 1);
        await func.execute(newsDataPromise[j]);
      }
    }
  } catch (err) {
    console.log(t, 'Error from cna webCrawlingNew', err);
    func.sendEmail(email, err);
  }
}
// 爬歷史新聞
async function webCrawlingAll(host) {
  const t = moment().format('YYYY-MM-DD-HH:mm:ss');
  try {
    const dbUrls = await db.getDbUrl('cna');
    for (let i = 1; i < 111; i++) {
      console.log(t, 'Cna webCrawlingAll in page ' + i);

      let links = await func.getCnaUrl(host, i);
      // 消除重複的連結和空字串
      links = new Set(links);
      links = [...links];
      links.filter((ele) => ele != '');
      // 若DB已有該新聞，則刪除該連結
      for (let i = 0; i < dbUrls.length; i++) {
        const index = links.indexOf(dbUrls[i]);
        if (index >= 0) {
          links.splice(index, 1);
        }
      }
      // 如果連結長度為零，則沒有新聞要新增
      if (links.length == 0) {
        console.log('In page ', i, 'there is no cna news has to be added.');
        continue;
      }
      // 將新增的新聞連結存進 dbUrls，待後續新聞比對是否重複
      for (let i = 0; i < links.length; i++) {
        dbUrls.push(links[i]);
      }
      // 將所有要新增的新聞拆成小包，先新增放新聞的空矩陣
      const newsDataPromise = [];
      for (let i = 0; i < (Math.floor((links.length) / 20) + 1); i++) {
        newsDataPromise[i] = [];
      }
      // 將新聞分裝到各個小包
      for (let i = 0; i < links.length; i++) {
        const index = Math.floor(i / 20);
        newsDataPromise[index].push(cna(links[i]));
      }
      // 執行各小包的新聞新增
      for (let j = 0; j < newsDataPromise.length; j++) {
        console.log('Cna old news has', newsDataPromise.length, 'set, now is: ', j + 1);
        await func.execute(newsDataPromise[j]);
      }
    }
  } catch (err) {
    console.log(t, 'Error from cna webCrawlingAll', err);
    func.sendEmail(email, err);
  }
}

module.exports = {
  all: webCrawlingAll,
  new: webCrawlingNew,
};
