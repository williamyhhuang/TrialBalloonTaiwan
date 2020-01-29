// Imports the Google Cloud client library
const language = require('@google-cloud/language');
// Creates a client
const client = new language.LanguageServiceClient();
const request = require('request');
const cheerio = require('cheerio');

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
    let url = `${host}+page=+${number}`;

    request(url, (err, response, body) => {
      if (err) {
        console.log('Error from request of getUrl', err);
      }
      const $ = cheerio.load(body);
      $('.col .title a').each(function (i, el) {
        let link = $(this).attr('href');
        links.push(link)
      });
      links.forEach((ele, i, arr) => {
        if (ele.indexOf('260407') == -1) {
          arr[i] = ''
        }
      })
      resolve(links);
    })
  })
}

function getCnaUrl(host, number) {
  return new Promise((resolve, reject) => {
    let links = [];
    let url = `${host}`;

    request(url, (err, response, body) => {
      if (err) {
        console.log('Error from request of getCnaUrl', err);
      }
      const $ = cheerio.load(body);
      
      // let test = $('a').text();
      // console.log('test',test)
      $('#myMainList a').each(function (i, el) {
        let link = $(this).attr('href');
        console.log(link)
        // links.push(link)
      });
      resolve(links);
    })
  })
}

module.exports = {
  selectAuthor: selectAuthor,
  analyzeArticle: analyzeArticle,
  analyzeEntities: analyzeEntities,
  deleteKeywords: deleteKeywords,
  getChtimesUrl: getChtimesUrl,
  getCnaUrl: getCnaUrl
};
