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

  // 建立以日/月為分類
  let monthSet = Object.keys(func.calcMonth(start, end));
  let dateSet = Object.keys(func.calcDate(start, end));

  if (keyword == '') {
    res.json({
      keyword: input,
      start: start,
      end: end,
      monthSet: monthSet,
      dateSet: dateSet,
      result: false
    })
  } else {
    Promise.all([db.getNews_media('cna', keyword, start, end), db.getNews_media('chtimes', keyword, start, end), db.getNews_media('ltn', keyword, start, end)]).then((values) => {

      let cnaReuslt = values[0];
      let chtimesReuslt = values[1];
      let ltnReuslt = values[2];

      let cnaResultAsMonth = func.categorizeNewsAsMonth(start, end, cnaReuslt);
      let chtimesResultAsMonth = func.categorizeNewsAsMonth(start, end, chtimesReuslt);
      let ltnResultAsMonth = func.categorizeNewsAsMonth(start, end, ltnReuslt);

      let cnaResultAsDate = func.categorizeNewsAsDate(start, end, cnaReuslt);
      let chtimesResultAsDate = func.categorizeNewsAsDate(start, end, chtimesReuslt);
      let ltnResultAsDate = func.categorizeNewsAsDate(start, end, ltnReuslt);

      if (cnaResultAsMonth == false && chtimesResultAsMonth == false && ltnResultAsMonth == false) {
        res.json({
          keyword: input,
          start: start,
          end: end,
          monthSet: monthSet,
          dateSet: dateSet,
          result: false
        })
      } else {

        let result = {
          cna: [cnaResultAsMonth, cnaResultAsDate],
          chtimes: [chtimesResultAsMonth, chtimesResultAsDate],
          ltn: [ltnResultAsMonth, ltnResultAsDate]
        }

        res.json({
          keyword: input,
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
