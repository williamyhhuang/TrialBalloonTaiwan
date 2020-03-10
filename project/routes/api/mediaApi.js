/* eslint-disable new-cap */
/* eslint-disable max-len */
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

  // 建立以日/月為分類
  const monthSet = Object.keys(func.calcMonth(start, end));
  const dateSet = Object.keys(func.calcDate(start, end));

  if (keyword == '') {
    res.json({
      keyword: input,
      start: start,
      end: end,
      monthSet: monthSet,
      dateSet: dateSet,
      result: false,
    });
  } else {
    Promise.all([db.getNews_media('cna', keyword, start, end), db.getNews_media('chtimes', keyword, start, end), db.getNews_media('ltn', keyword, start, end)]).then((values) => {
      const cnaReuslt = values[0];
      const chtimesReuslt = values[1];
      const ltnReuslt = values[2];

      const cnaResultAsMonth = func.categorizeNewsAsMonth(start, end, cnaReuslt);
      const chtimesResultAsMonth = func.categorizeNewsAsMonth(start, end, chtimesReuslt);
      const ltnResultAsMonth = func.categorizeNewsAsMonth(start, end, ltnReuslt);

      const cnaResultAsDate = func.categorizeNewsAsDate(start, end, cnaReuslt);
      const chtimesResultAsDate = func.categorizeNewsAsDate(start, end, chtimesReuslt);
      const ltnResultAsDate = func.categorizeNewsAsDate(start, end, ltnReuslt);

      if (cnaResultAsMonth == false && chtimesResultAsMonth == false && ltnResultAsMonth == false) {
        res.json({
          keyword: input,
          start: start,
          end: end,
          monthSet: monthSet,
          dateSet: dateSet,
          result: false,
        });
      } else {
        const result = {
          cna: [cnaResultAsMonth, cnaResultAsDate],
          chtimes: [chtimesResultAsMonth, chtimesResultAsDate],
          ltn: [ltnResultAsMonth, ltnResultAsDate],
        };

        res.json({
          keyword: input,
          start: start,
          end: end,
          monthSet: monthSet,
          dateSet: dateSet,
          result: result,
        });
      }
    });
  }
});

module.exports = router;
