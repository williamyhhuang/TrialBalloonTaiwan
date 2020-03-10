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
  const media1 = req.query.media1;
  const reporter1 = req.query.reporter1;
  const media2 = req.query.media2;
  const reporter2 = req.query.reporter2;
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
      reporter1: [media1, reporter1],
      reporter2: [media2, reporter2],
      start: start,
      end: end,
      monthSet: monthSet,
      dateSet: dateSet,
      result: false,
    });
  } else {
    Promise.all([db.getNews_reporter(media1, keyword, start, end, reporter1), db.getNews_reporter(media2, keyword, start, end, reporter2)]).then((values) => {
      const reporter1Result = values[0];
      const reporter2Result = values[1];

      const reporter1ResultAsMonth = func.categorizeNewsAsMonth(start, end, reporter1Result);
      const reporter2ResultAsMonth = func.categorizeNewsAsMonth(start, end, reporter2Result);

      const reporter1ResultAsDate = func.categorizeNewsAsDate(start, end, reporter1Result);
      const reporter2ResultAsDate = func.categorizeNewsAsDate(start, end, reporter2Result);

      if (reporter1Result == false && reporter2Result == false) {
        res.json({
          keyword: input,
          reporter1: [media1, reporter1],
          reporter2: [media2, reporter2],
          start: start,
          end: end,
          monthSet: monthSet,
          dateSet: dateSet,
          result: false,
        });
      } else {
        const result = {
          reporter1: [reporter1ResultAsMonth, reporter1ResultAsDate],
          reporter2: [reporter2ResultAsMonth, reporter2ResultAsDate],
        };

        res.json({
          keyword: input,
          reporter1: [media1, reporter1],
          reporter2: [media2, reporter2],
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
