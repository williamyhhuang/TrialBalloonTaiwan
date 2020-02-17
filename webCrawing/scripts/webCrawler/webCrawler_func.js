// Imports the Google Cloud client library
const language = require('@google-cloud/language');
// Creates a client
const client = new language.LanguageServiceClient();
const request = require('request');
const cheerio = require('cheerio');
const axios = require('axios');
const puppeteer = require('puppeteer');
const db = require('./webCrawler_db');
const nodejieba = require('nodejieba');
const gmail = require('./gmail');
nodejieba.load({ userDict: 'scripts/similarity/dict.txt' });


async function selectAuthor(list, text) {

  // Prepares a document, representing the provided text
  const document = {
    content: text,
    type: 'PLAIN_TEXT',
  };

  // Detects syntax in the document
  const [syntax] = await client.analyzeSyntax({ document });
  let index = [];

  syntax.tokens.forEach(part => {
    index.push(part.text.content);
  });
  let start;
  let end;
  if (index.indexOf('社記者') > -1) {
    start = index.indexOf('社記者') + 1;
  } else if (index.indexOf('記者') > -1) {
    start = index.indexOf('記者') + 1;
  }

  for (let i = 0; i < list.length; i++) {
    if (index.indexOf(list[i]) > -1) {
      end = index.indexOf(list[i]);
      break;
    }
  }
  let author = index.slice(start, end)
  return author.join('')
}

function cnaSelectAuthor(list, string) {
  return new Promise((resolve, reject) => {
    let author;
    string = string.trim();
    author = nodejieba.cut(string);
    let start;
    let end;
    start = author.indexOf('記者');

    let number = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    let index3;
    for (let j = 0; j < number.length; j++) {
      index3 = author.indexOf(number[j]);
    }
    for (let i = 0; i < list.length; i++) {
      let index1 = author.indexOf(list[i]);
      let index2 = author.indexOf('專電');
      if (index1 >= 0) {
        end = index1;
        // break;
      } else if (index2 >= 0) {
        end = index2;
      } else if (index3 >= 0) {
        end = index3;
      }
    }
    // console.log(start, end)
    author = author.slice(start + 1, end);
    author = author.join('');
    resolve(author);
  })
}

function ltnSelectAuthor(list, text) {
  return new Promise((resolve, reject) => {
    let string = text.substring(0, 100).trim();
    let author;
    author = nodejieba.cut(string);

    if (string.indexOf('即時新聞') >= 0) {
      author = '即時新聞';
    } else if (string.indexOf('財經頻道') >= 0) {
      author = '財經頻道';
    } else if (string.indexOf('中央社') >= 0) {
      author = '中央社';
    } else if (author.indexOf('記者') >= 0) {
      let start = author.indexOf('記者');
      let end = author.indexOf('／');
      author = author.slice(start + 1, end);
      author = author.join('');
    } else if (author.indexOf('編譯') >= 0) {
      let start = author.indexOf('編譯');
      let end = author.indexOf('／');
      author = author.slice(start + 1, end);
      author = author.join('');
    } else if (author.indexOf('特派員') >= 0) {
      let start = author.indexOf('特派員');
      let end = author.indexOf('／');
      author = author.slice(start + 1, end);
      author = author.join('');
    } else {
      author = 'ltn';
    }
    // if (string.indexOf('即時新聞') >= 0) {
    //   author = '即時新聞';
    //   author = author.split('、');
    // } else if (string.indexOf('譯') >= 0) {
    //   let start = string.indexOf('譯');
    //   let end = string.indexOf('／');
    //   author = string.slice(start + 1, end);
    //   author = author.split('、');
    // } else if (string.indexOf('者') >= 0) {
    //   let start = string.indexOf('者');
    //   let end =string.indexOf('／');
    //   author = string.slice(start + 1, end);
    //   author = author.split('、');
    // } else if (string.indexOf('員') >= 0) {
    //   let start = string.indexOf('員');
    //   let end = string.indexOf('／');
    //   author = string.slice(start + 1, end);
    //   author = author.split('、');
    // } else if (string.indexOf('／') == -1) {
    //   author = 'ltn'
    //   author = author.split('、');
    // } else {
    //   author = 'ltn'
    //   author = author.split('、');
    // }
    resolve(author);
  })
}

async function analyzeArticle(text) {
  const document = {
    content: text,
    type: 'PLAIN_TEXT',
  };

  // Detects the sentiment of the document
  const [result] = await client.analyzeSentiment({ document });

  const sentiment = result.documentSentiment;
  // console.log(`Document sentiment:`);
  // console.log(`  Score: ${sentiment.score}`);
  // console.log(`  Magnitude: ${sentiment.magnitude}`);

  return {
    score: sentiment.score,
    magnitude: sentiment.magnitude
  }
  // const sentences = result.sentences;
  // sentences.forEach(sentence => {
  //     console.log(`Sentence: ${sentence.text.content}`);
  //     console.log(`  Score: ${sentence.sentiment.score}`);
  //     console.log(`  Magnitude: ${sentence.sentiment.magnitude}`);
  // });
}

async function analyzeEntities(text) {
  const document = {
    content: text,
    type: 'PLAIN_TEXT',
  };

  // Detects entities in the document
  const [result] = await client.analyzeEntities({ document });

  const entities = result.entities;
  let index = [];
  // console.log('Entities:');
  entities.forEach(entity => {
    // console.log(entity.name);
    // console.log(` - Type: ${entity.type}, Salience: ${entity.salience}`);
    if (entity.metadata && entity.metadata.wikipedia_url) {
      index.push(entity.name);
      // console.log(` - Wikipedia URL: ${entity.metadata.wikipedia_url}$`);
    }
  });
  return index;
}

function deleteKeywords(keywords, exceptKeywords, cityList) {
  for (let i = 0; i < exceptKeywords.length; i++) {
    if (keywords.indexOf(exceptKeywords[i]) > -1) {
      let index = keywords.indexOf(exceptKeywords[i])
      keywords.splice(index, 1);
    }
  }
  for (let j = 0; j < cityList.length; j++) {
    if (keywords.indexOf(cityList[j]) > -1) {
      let index = keywords.indexOf(cityList[j])
      keywords.splice(index, 1);
    }
  }
  keywords.filter((item, index) => keywords.indexOf(item) === index);
  // console.log('keywords', keywords);
}

function getChtimesUrl(host, number) {
  return new Promise((resolve, reject) => {
    let links = [];
    let url = `${host}page=${number}`;

    request(url, (err, response, body) => {
      if (err) {
        console.log('Error from request of getUrl', err);
      }
      const $ = cheerio.load(body);
      $('.col .title a').each(function () {
        let link = $(this).attr('href');
        if (link.indexOf('https://www.chinatimes.com') == -1) {
          link = 'https://www.chinatimes.com' + link;
        }  
        links.push(link)
      });

      for (let i = 0; i < links.length; i++) {
        if (links[i] == 'https://www.chinatimes.com') {
          links[i] = ''
          console.log('i got it')
        }
      }

      links.forEach((ele, i, arr) => {
        if (ele.indexOf('260407') == -1) {
          arr[i] = ''
        }
      })
      // console.log(number, links)
      resolve(links);
    })
  })
}

function getCnaUrl(host, number) {
  return new Promise((resolve, reject) => {
    let links = [];
    let url = `${host}${number}`;

    axios.get(url)
      .then((result) => {
        let news = result.data.result.SimpleItems;
        for (let i = 0; i < news.length; i++) {
          if (news[i].ClassName == '政治') {
            links.push(news[i].PageUrl)
          }
        }
        resolve(links)
      })
  })
}

function getLtnUrl(host, number, startTime, endTime) {
  return new Promise((resolve, reject) => {
    let links = [];
    let url = `${host}&conditions=and&start_time=${startTime}&end_time=${endTime}&page=${number}`;

    request(url, (err, response, body) => {
      if (err) {
        console.log('Error from request of getUrl', err);
      }
      const $ = cheerio.load(body);
      if ($('.content .whitecon ul').text() == null) {
        resolve(false)
      } else {
        $('.content .whitecon ul a').each(function () {
          let link = $(this).attr('href');
          links.push(link)
        });

        links.forEach((ele, i) => {
          if (ele.indexOf('politics') == -1) {
            links.splice(i, 1);
          }
        })

        resolve(links);
      }
    })
  })
}

function getLtnUrlNew(host) {
  return new Promise(async (resolve, reject) => {
    try {
      const browser = await puppeteer.launch({
        headless: true
      });
      const page = await browser.newPage();
      await Promise.race([
        await page.goto(host, {
          timeout: 0
        }),
      ])
      // await page.setViewport({
      //   width: 1200,
      //   height: 800
      // });

      await autoScroll(page)
        .then(async () => {
          const href = await page.$$eval('.tit', e => e.map((a) => a.href));
          await browser.close();
          resolve(href);
        })
    } catch (e) {
      console.log('error from gettin ltn url: ', e);
      func.sendEmail('yhhuang1992@gmail.com');
    }
  })
}

async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve, reject) => {
      var totalHeight = 0;
      var distance = 100;
      var timer = setInterval(() => {
        var scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });
}

function execute(newsDataPromise) {
  return new Promise((resolve, reject) => {
    setTimeout(function () {
      resolve(
        Promise.all(newsDataPromise)
          .then(newsData => {
            let insertDataPromise = []
            for (let i = 0; i < newsData.length; i++) {
              insertDataPromise.push(db.insert(newsData[i]));
            }
            Promise.all(insertDataPromise).catch(e => {
              console.log('error from insertDataPromise', e)
            })
          }).catch(error => {
            console.log('error from newsDataPromise', error)
          })
      );
    }, 10000)
  })
}

// 寄信給使用者
function sendEmail(email) {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: gmail.user,
        pass: gmail.password
      }
    })
    const mailOptions = {
      from: gmail.user,
      to: email,
      subject: 'TBT爬蟲出現問題',
      text: 'TBT爬蟲程式出現問題，請前往查看'
    };
    transporter.sendMail(mailOptions, (err, data) => {
      if (err) {
        console.log(err);
      }
      return console.log('Email發送OK');
    });
}

module.exports = {
  selectAuthor: selectAuthor,
  cnaSelectAuthor: cnaSelectAuthor,
  ltnSelectAuthor: ltnSelectAuthor,
  analyzeArticle: analyzeArticle,
  analyzeEntities: analyzeEntities,
  deleteKeywords: deleteKeywords,
  getChtimesUrl: getChtimesUrl,
  getCnaUrl: getCnaUrl,
  getLtnUrl: getLtnUrl,
  getLtnUrlNew: getLtnUrlNew,
  execute: execute,
  sendEmail: sendEmail
};
