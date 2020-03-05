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
  let media1 = req.query.media1;
  let reporter1 = req.query.reporter1;
  let media2 = req.query.media2;
  let reporter2 = req.query.reporter2;
  let input = req.query.keyword;
  let start = req.query.start;
  let end = req.query.end;
  keyword = input.split(' ');

  // 建立以日/月為分類
  let monthSet = Object.keys(func.calcMonth(start, end));
  let dateSet = Object.keys(func.calcDate(start, end));
  
  if (keyword == '') {
    res.json({
      keyword: input,
      reporter1: [media1, reporter1],
      reporter2: [media2, reporter2],
      start: start,
      end: end,
      monthSet: monthSet,
      dateSet: dateSet,
      result: false
    })
  } else {
    Promise.all([db.getNews_reporter(media1, keyword, start, end, reporter1), db.getNews_reporter(media2, keyword, start, end, reporter2)]).then((values) => {

      let reporter1Result = values[0];
      let reporter2Result = values[1];

      let reporter1ResultAsMonth = func.categorizeNewsAsMonth(start, end, reporter1Result);
      let reporter2ResultAsMonth = func.categorizeNewsAsMonth(start, end, reporter2Result);

      let reporter1ResultAsDate = func.categorizeNewsAsDate(start, end, reporter1Result);
      let reporter2ResultAsDate = func.categorizeNewsAsDate(start, end, reporter2Result);

      if (reporter1Result == false && reporter2Result == false) {
        res.json({
          keyword: input,
          reporter1: [media1, reporter1],
          reporter2: [media2, reporter2],
          start: start,
          end: end,
          monthSet: monthSet,
          dateSet: dateSet,
          result: false
        })
      } else {
        let result = {
          reporter1: [reporter1ResultAsMonth, reporter1ResultAsDate],
          reporter2: [reporter2ResultAsMonth, reporter2ResultAsDate]
        }

        res.json({
          keyword: input,
          reporter1: [media1, reporter1],
          reporter2: [media2, reporter2],
          start: start,
          end: end,
          monthSet: monthSet,
          dateSet: dateSet,
          result: result
        })
      }

    })
  }

});

module.exports = router;
