require('dotenv').config();
const email = process.env.EMAIL;
const request = require('request');
const cheerio = require('cheerio');
const func = require('./webCrawler/webCrawler_func');
const db = require('./webCrawler/webCrawler_db');
const nodejieba = require("nodejieba");
const cityList = require('./webCrawler/localName');
nodejieba.load({ userDict: 'scripts/similarity/dict.txt' });

let exceptKeywords = [
  '中央社',
  '中常委',
  '中時電子報',
  'CTWANT'
]

function ltn(url) {
  return new Promise((resolve, reject) => {
    request(url, async (err, response, body) => {
      if (err) {
        reject(err);
        throw err
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

      } catch (e) {
        console.log('error from function ltn', e)
      }
    }) // end of request
  })
}

async function crawler(host, startTime, endTime) {
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
          for (let i = 0; i < dbUrls.length; i++) {
            let index = links.indexOf(dbUrls[i]);
            if (index >= 0) {
              links.splice(index, 1)
            }
          }

          if (links.length == 0) {
            console.log('page ', page, 'there is no ltn news has to add.');
            page = page + 1;
            continue;
          }

          for (let i = 0; i < links.length; i++) {
            dbUrls.push(links[i]);
          }

          let newsDataPromise = [];
          for (let i = 0; i < (Math.floor((links.length) / 20) + 1); i++) {
            newsDataPromise[i] = [];
          }

          for (let i = 0; i < links.length; i++) {
            let index = Math.floor(i / 20);
            newsDataPromise[index].push(ltn(links[i]));
          }

          for (let j = 0; j < newsDataPromise.length; j++) {
            console.log('ltn all total length', newsDataPromise.length, 'now is: ', j + 1)
            await func.execute(newsDataPromise[j]);
          }

          /*
          let newsDataPromise = [];
          for (let i = 0; i < links.length; i++) {
            newsDataPromise.push(ltn(links[i]));
          }
          
          Promise.all(newsDataPromise)
            .then(newsData => {
              let insertDataPromise = []
              for (let i = 0; i < newsData.length; i++) {
                insertDataPromise.push(db.insert(newsData[i]));
              }
              Promise.all(insertDataPromise).catch(e => {
                console.log(e)
              })
            }).catch(error => {
              console.log(error)
            })
*/
          page = page + 1;
        }
      } while (enough == false)
    }, 60000 * 2)
  } catch (e) {
    console.log('err from ltn crawler', e)
  }
}

async function webCrawlingAll(host, start, end) {
  try {
    console.log('start ltn web-crawing all from ' + start + 'to ' + end);

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
      await crawler(host, time[t], time[t + 1]);
    }
  } catch (e) {
    console.log('err from ltn web-crawling all', e);
  }
}

async function webCrawingNew(host) {
  try {
    console.log('ltn web crawling new start')
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

    if (links.length == 0) {
      console.log('there is no ltn news has to add.');
      return;
    }

    for (let i = 0; i < links.length; i++) {
      dbUrls.push(links[i]);
    }

    let newsDataPromise = [];
    for (let i = 0; i < (Math.floor((links.length) / 20) + 1); i++) {
      newsDataPromise[i] = [];
    }

    for (let i = 0; i < links.length; i++) {
      let index = Math.floor(i / 20);
      newsDataPromise[index].push(ltn(links[i]));
    }

    for (let j = 0; j < newsDataPromise.length; j++) {
      console.log('ltn new total length', newsDataPromise.length, 'now is: ', j + 1)
      await func.execute(newsDataPromise[j]);
    }

  } catch (e) {
    console.log('error from webCrawlingNew', e)
    func.sendEmail(email);
  }
}

module.exports = {
  all: webCrawlingAll,
  new: webCrawingNew
}
