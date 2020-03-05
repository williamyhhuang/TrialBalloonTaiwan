const express = require('express');
const router = express.Router();
const cst = require('../../util/consts');
const db = require('./api_db');
const func = require('./api_func');

router.use("/", function (req, res, next) {
  res.set("Access-Control-Allow-Origin", cst.HOST_NAME);
  res.set("Access-Control-Allow-Headers", "Origin, Content-Type");
  res.set("Access-Control-Allow-Methods", "GET");
  next();
});

router.get('/', async function (req, res, next) {
  let input = req.query.keyword;
  let start = req.query.start;
  let end = req.query.end;

  keyword = input.split(' ');

  if (keyword == '') {
    res.json({
      keyword: input,
      start: start,
      end: end,
      result: false
    })
  } else {
    Promise.all([db.getNews_news('cna', keyword, start, end), db.getNews_news('chtimes', keyword, start, end), db.getNews_news('ltn', keyword, start, end)]).then((values) => {
      let set = values[0];
      let chtimes = values[1];
      let ltn = values[2];

      let cna = [];
      // CNA隨機取四則新聞，各家報社的新聞與這四則新聞比較，取出最相似的新聞
      for (let i = 0; i < 4; i++) {
        let eachNews = set[Math.floor(Math.random() * set.length)];
        cna.push(eachNews);
      }
      // 如果中央社沒有該關鍵字的新聞，回傳 false
      if (set == false) {
        res.json({
          keyword: input,
          start: start,
          end: end,
          result: false
        })
        // 如果中時電子報沒有關於該關鍵字的新聞
      } else if (chtimes == false) {
        let result = [];

        for (let i = 0; i < cna.length; i++) {
          let cnaLtn = func.comparison(cna[i], ltn);
          let cnaData = {
            media: cna[i].media,
            date: cna[i].date,
            reporter: cna[i].reporter,
            title: cna[i].title,
            url: cna[i].url,
            score: Number(cna[i].score).toFixed(2),
            magnitude: Number(cna[i].magnitude).toFixed(2)
          }
          result.push({
            chtimes: false,
            cna: cnaData,
            ltn: cnaLtn,
          })
        }

        res.json({
          keyword: input,
          start: start,
          end: end,
          result: result
        })
        // 如果自由電子報沒有關於該關鍵字的新聞
      } else if (ltn == false) {
        let result = [];
        for (let i = 0; i < cna.length; i++) {
          let cnaChtimes = func.comparison(cna[i], chtimes);
          let cnaData = {
            media: cna[i].media,
            date: cna[i].date,
            reporter: cna[i].reporter,
            title: cna[i].title,
            url: cna[i].url,
            score: Number(cna[i].score).toFixed(2),
            magnitude: Number(cna[i].magnitude).toFixed(2)
          }

          result.push({
            chtimes: cnaChtimes,
            cna: cnaData,
            ltn: false,
          })
        }

        res.json({
          keyword: input,
          start: start,
          end: end,
          result: result
        })
        // 三家報社都有關於該關鍵字的新聞
      } else {
        let result = [];
        for (let i = 0; i < cna.length; i++) {
          let cnaChtimes = func.comparison(cna[i], chtimes);
          let cnaLtn = func.comparison(cna[i], ltn);
          let cnaData = {
            media: cna[i].media,
            date: cna[i].date,
            reporter: cna[i].reporter,
            title: cna[i].title,
            url: cna[i].url,
            score: Number(cna[i].score).toFixed(2),
            magnitude: Number(cna[i].magnitude).toFixed(2)
          }
          result.push({
            chtimes: cnaChtimes,
            cna: cnaData,
            ltn: cnaLtn,
          })
        }

        res.json({
          keyword: input,
          start: start,
          end: end,
          result: result
        })

      }

    })
  }
});


module.exports = router;

// 根據每篇的新聞斷詞，比較新聞相似度，並挑出相似度最高的那篇
function comparison(cna, media) {

  if (media == false) {
    return false
  } else {
    let result = media[0];
    // 原斷詞資料為字串，須改為矩陣
    let max = CalcSimilarity((cna.tokenize).split(','), (media[0].tokenize).split(','));
    for (let i = 0; i < media.length; i++) {
      let compare = CalcSimilarity((cna.tokenize).split(','), (media[i].tokenize).split(','));
      if (compare > max) {
        max = compare;
        result = media[i];
      }
    }
    return {
      media: result.media,
      date: result.date,
      reporter: result.reporter,
      title: result.title,
      url: result.url,
      score: Number(result.score).toFixed(2),
      magnitude: Number(result.magnitude).toFixed(2)
    };
  }
}
// 計算兩篇新聞的相似度
function CalcSimilarity(str1, str2) {

  str1 = str1.sort();
  str2 = str2.sort();

  let index = [...new Set(str1)].concat([...new Set(str2)]);

  index = index.sort();

  let str1_mapping = {};
  let str2_mapping = {};
  str1.forEach(el => {
    if (str1_mapping[el] != null) {
      str1_mapping[el] += 1;
    } else {
      str1_mapping[el] = 1;
    }
  })

  str2.forEach(el => {
    if (str2_mapping[el] != null) {
      str2_mapping[el] += 1;
    } else {
      str2_mapping[el] = 1;
    }
  })

  let str1_vec = [];
  let str2_vec = [];
  index.forEach((el, i) => {

    if (str1_mapping[el]) {
      str1_vec[i] = str1_mapping[el];
    } else {
      str1_vec[i] = 0;
    }

    if (str2_mapping[el]) {
      str2_vec[i] = str2_mapping[el];
    } else {
      str2_vec[i] = 0;
    }
  })
  let s = similarity(str1_vec, str2_vec);
  return s;

}
