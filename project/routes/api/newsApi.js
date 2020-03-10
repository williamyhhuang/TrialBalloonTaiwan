/* eslint-disable require-jsdoc */
/* eslint-disable max-len */
/* eslint-disable new-cap */
const express = require('express');
const router = express.Router();
const cst = require('../../util/consts');
const db = require('./api_db');
const func = require('./api_func');

router.use('/', function(req, res, next) {
  res.set('Access-Control-Allow-Origin', cst.HOST_NAME);
  res.set('Access-Control-Allow-Headers', 'Origin, Content-Type');
  res.set('Access-Control-Allow-Methods', 'GET');
  next();
});

router.get('/', async function(req, res, next) {
  const input = req.query.keyword;
  const start = req.query.start;
  const end = req.query.end;

  keyword = input.split(' ');

  if (keyword == '') {
    res.json({
      keyword: input,
      start: start,
      end: end,
      result: false,
    });
  } else {
    Promise.all([db.getNews_news('cna', keyword, start, end), db.getNews_news('chtimes', keyword, start, end), db.getNews_news('ltn', keyword, start, end)]).then((values) => {
      const set = values[0];
      const chtimes = values[1];
      const ltn = values[2];

      const cna = [];
      // CNA隨機取四則新聞，各家報社的新聞與這四則新聞比較，取出最相似的新聞
      for (let i = 0; i < 4; i++) {
        const eachNews = set[Math.floor(Math.random() * set.length)];
        cna.push(eachNews);
      }
      // 如果中央社沒有該關鍵字的新聞，回傳 false
      if (set == false) {
        res.json({
          keyword: input,
          start: start,
          end: end,
          result: false,
        });
        // 如果中時電子報沒有關於該關鍵字的新聞
      } else if (chtimes == false) {
        const result = [];

        for (let i = 0; i < cna.length; i++) {
          const cnaLtn = func.comparison(cna[i], ltn);
          const cnaData = {
            media: cna[i].media,
            date: cna[i].date,
            reporter: cna[i].reporter,
            title: cna[i].title,
            url: cna[i].url,
            score: Number(cna[i].score).toFixed(2),
            magnitude: Number(cna[i].magnitude).toFixed(2),
          };
          result.push({
            chtimes: false,
            cna: cnaData,
            ltn: cnaLtn,
          });
        }

        res.json({
          keyword: input,
          start: start,
          end: end,
          result: result,
        });
        // 如果自由電子報沒有關於該關鍵字的新聞
      } else if (ltn == false) {
        const result = [];
        for (let i = 0; i < cna.length; i++) {
          const cnaChtimes = func.comparison(cna[i], chtimes);
          const cnaData = {
            media: cna[i].media,
            date: cna[i].date,
            reporter: cna[i].reporter,
            title: cna[i].title,
            url: cna[i].url,
            score: Number(cna[i].score).toFixed(2),
            magnitude: Number(cna[i].magnitude).toFixed(2),
          };

          result.push({
            chtimes: cnaChtimes,
            cna: cnaData,
            ltn: false,
          });
        }

        res.json({
          keyword: input,
          start: start,
          end: end,
          result: result,
        });
        // 三家報社都有關於該關鍵字的新聞
      } else {
        const result = [];
        for (let i = 0; i < cna.length; i++) {
          const cnaChtimes = func.comparison(cna[i], chtimes);
          const cnaLtn = func.comparison(cna[i], ltn);
          const cnaData = {
            media: cna[i].media,
            date: cna[i].date,
            reporter: cna[i].reporter,
            title: cna[i].title,
            url: cna[i].url,
            score: Number(cna[i].score).toFixed(2),
            magnitude: Number(cna[i].magnitude).toFixed(2),
          };
          result.push({
            chtimes: cnaChtimes,
            cna: cnaData,
            ltn: cnaLtn,
          });
        }

        res.json({
          keyword: input,
          start: start,
          end: end,
          result: result,
        });
      }
    });
  }
});


module.exports = router;
