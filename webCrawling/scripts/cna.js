require('dotenv').config();
const email = process.env.EMAIL;
const request = require('request');
const cheerio = require('cheerio');
const func = require('./webCrawler/webCrawler_func');
const db = require('./webCrawler/webCrawler_db');
const nodejieba = require("nodejieba");
const cityList = require('./webCrawler/localName');
nodejieba.load({ userDict: 'scripts/similarity/dict2.txt' });

let exceptKeywords = [
  '中央社',
  '中常委',
  '中時電子報',
  'CTWANT'
]

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
        let string = article.substring(1, 30);
        let author = await func.cnaSelectAuthor(cityList, string);
        author = author.split('、');
        let number = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
        for (let i = 0; i < author.length; i++) {
          if (author[i].length >= 4) {
            author[i] = await func.cnaSelectAuthor(cityList, author[i]);
          }
          for (let j = 0; j < number.length; j++) {
            let index = author[i].indexOf(number[j]);
            if (index >= 0) {
              author[i] = author[i].slice(0, index)
            }
          }
        }

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

async function webCrawlingNew(host) {
  try {
    console.log('cna web crawling new start')
    let dbUrls = await db.getDbUrl('cna');

    for (let i = 1; i < 6; i++) {
      console.log('cna web-crawling new in page ' + i);

      let links = await func.getCnaUrl(host, i);

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

      // 消除重複的連結和空字串
      // links = new Set(links);
      // links = [...links];
      // for (let i = 0; i < links.length; i++) {
      //   let index = links.indexOf('');
      //   if (index >= 0) {
      //     index.splice(index, 1);
      //   }
      // }

      if (links.length == 0) {
        console.log('page ', i, ' there is no cna news has to add.')
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
        newsDataPromise[index].push(cna(links[i]));
      }

      for (let j = 0; j < newsDataPromise.length; j++) {
        console.log('cna new total length', newsDataPromise.length, 'now is: ', j + 1)
        await func.execute(newsDataPromise[j]);
      }
    }
  } catch (e) {
    console.log(e)
    func.sendEmail(email);
  }
}

async function webCrawlingAll(host) {
  try {
    let dbUrls = await db.getDbUrl('cna');

    for (let i = 1; i < 111; i++) {

      console.log('cna web-crawling all in page ' + i);

      let links = await func.getCnaUrl(host, i);

      for (let i = 0; i < dbUrls.length; i++) {
        let index = links.indexOf(dbUrls[i]);
        if (index >= 0) {
          links.splice(index, 1)
        }
      }

      if (links.length == 0) {
        console.log('page ', i, ' there is no cna news has to add.')
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
        newsDataPromise[index].push(cna(links[i]));
      }

      for (let j = 0; j < newsDataPromise.length; j++) {
        console.log('cna all total length', newsDataPromise.length, 'now is: ', j + 1)
        await func.execute(newsDataPromise[j]);
      }

    }
  } catch (e) {
    console.log(e)
  }
}

module.exports = {
  all: webCrawlingAll,
  new: webCrawlingNew
}
