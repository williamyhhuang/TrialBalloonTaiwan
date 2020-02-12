const express = require('express');
const router = express.Router();
const mysql = require('../../util/mysqlcon');
const similarity = require('compute-cosine-similarity');

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
    Promise.all([news('cna', keyword, start, end), news('chtimes', keyword, start, end), news('ltn', keyword, start, end)]).then((values) => {
      let set = values[0];
      let chtimes = values[1];
      let ltn = values[2];

      let cna = [];
      // CNA隨機取四則新聞
      for (let i = 0; i < 4; i++) {
        let oneNews = set[Math.floor(Math.random() * set.length)];
        cna.push(oneNews);
      }

      if (cna == false) {

        res.json({
          keyword: input,
          start: start,
          end: end,
          result: false
        })

      } else if (chtimes == false) {
        let result = [];
        for (let i = 0; i < cna.length; i++) {
          let cnaLtn = comparison(cna[i], ltn);

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

      } else if (ltn == false) {
        let result = [];
        for (let i = 0; i < cna.length; i++) {
          let cnaChtimes = comparison(cna[i], chtimes);

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

      } else {
        let result = [];
        for (let i = 0; i < cna.length; i++) {
          let cnaChtimes = comparison(cna[i], chtimes);
          let cnaLtn = comparison(cna[i], ltn);

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

function news(media, input, start, end) {
  return new Promise((resolve, reject) => {
    let mediaName;
    let sql = `SELECT n.*, a.tokenize FROM tbt.news AS n INNER JOIN tbt.article AS a ON n.media = '${media}' AND a.news_url=n.url`;
    for (let i = 0; i < input.length; i++) {
      sql += ` AND a.article LIKE '%${input[i]}%'`
    }
    sql += ` AND TO_DAYS(n.date)>= TO_DAYS('${start}') AND TO_DAYS(n.date) < TO_DAYS('${end}')`;

    switch (media) {
      case 'cna':
        mediaName = '中央社';
        break;
      case 'chtimes':
        mediaName = '中時電子報';
        break;
      case 'ltn':
        mediaName = '自由電子報';
    }

    mysql.query(sql, function (err, result) {
      if (err) throw err;
      if (result.length == 0) {
        resolve(false);
      } else {
        let data = [];
        for (let i = 0; i < result.length; i++) {
          let reporterSql = `SELECT r.name FROM reporter AS r, reporter_has_news AS rn WHERE rn.news_id='${result[i].id}' AND r.id = rn.reporter_id`;
          mysql.query(reporterSql, function (err, reporter) {
            if (err) throw err;

            let name = [];
            for (let j = 0; j < reporter.length; j++) {
              name.push(reporter[j].name);
            }
            let date = result[i].date;
            date = date.replace(/-/g, '/');

            data.push({
              media: mediaName,
              date: date,
              reporter: name.join(' '),
              title: result[i].title,
              tokenize: result[i].tokenize,
              url: result[i].url,
              score: result[i].score,
              magnitude: result[i].magnitude
            })
            if (i == result.length - 1) {
              resolve(data);
            }
          })
        }
      }
    })
  })
}

// 比較新聞相似度
function comparison(cna, media) {

  if (media == false) {
    return false
  } else {
    let result = media[0];
    let max = CalSimilarity((cna.tokenize).split(','), (media[0].tokenize).split(','));
    for (let i = 0; i < media.length; i++) {
      let compare = CalSimilarity((cna.tokenize).split(','), (media[i].tokenize).split(','));
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

function CalSimilarity(str1, str2) {

  str1 = str1.sort();
  str2 = str2.sort();

  let index = [...new Set(str1)].concat([...new Set(str2)]);

  index = index.sort();
  // console.log('str',str1, str2, index)
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
