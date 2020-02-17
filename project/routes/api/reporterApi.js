const express = require('express');
const router = express.Router();
const mysql = require('../../util/mysqlcon');

router.get('/', async function (req, res, next) {
  let media1 = req.query.media1;
  let reporter1 = req.query.reporter1;
  let media2 = req.query.media2;
  let reporter2 = req.query.reporter2;
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
    Promise.all([news(media1, keyword, start, end, reporter1), news(media2, keyword, start, end, reporter2)]).then((values) => {

      let reporter1Result = values[0];
      let reporter2Result = values[1];

      let result1 = media(start, end, reporter1Result);
      let result2 = media(start, end, reporter2Result);

      let result1Day = mediaDay(start, end, reporter1Result);
      let result2Day = mediaDay(start, end, reporter2Result);

      if (reporter1Result == false && reporter2Result == false) {
        res.json({
          keyword: input,
          start: start,
          end: end,
          result: false
        })
      } else {
        let result = {
          reporter1: [result1, result1Day],
          reporter2: [result2, result2Day]
        }

        res.json({
          keyword: input,
          reporter1: [media1, reporter1],
          reporter2: [media2, reporter2],
          start: start,
          end: end,
          result: result
        })
      }

    })
  }

});

module.exports = router;

function news(media, input, start, end, name) {
  return new Promise((resolve, reject) => {
    let mediaName;
    let sql = `SELECT n.* FROM tbt.news AS n INNER JOIN tbt.reporter_has_news AS rn  ON n.id = rn.news_id INNER JOIN tbt.reporter AS r ON rn.reporter_id = r.id AND r.name='${name}' INNER JOIN tbt.article AS a ON n.url = a.news_url `;
    for (let i = 0; i < input.length; i++) {
      sql += ` AND a.article LIKE '%${input[i]}%'`
    }
    sql += ` AND TO_DAYS(n.date)>= TO_DAYS('${start}') AND TO_DAYS(n.date) <= TO_DAYS('${end}') ORDER by n.date`;

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
          let date = result[i].date;
          date = date.replace(/-/g, '/');

          data.push({
            media: mediaName,
            date: date,
            title: result[i].title,
            url: result[i].url,
            score: result[i].score,
            magnitude: result[i].magnitude
          })
          if (i == result.length - 1) {
            resolve(data);
          }
        }
      }
    })
  })
}

function category(start, end) {

  let startTime = new Date(start);
  let endTime = new Date(end);
  let s = String(startTime.getFullYear()) + String(startTime.getMonth() + 1);
  let e = String(endTime.getFullYear()) + String(endTime.getMonth() + 1);

  let y = startTime.getFullYear();
  let m = startTime.getMonth() + 1;

  let t = [];
  t[0] = String(startTime.getFullYear()) + '/' + String(startTime.getMonth() + 1);;
  if (s == e) {
    let result = {};
    t.forEach(el => {
      result[el] = {
        news: [],
        totalScore: 0,
        totalMag: 0
      };
    })
    return result;
  } else {
    let last;
    do {
      m = m + 1;
      if (m == 13) {
        m = m - 12;
        y = y + 1;
      }
      let time = String(y) + String(m);
      time = Number(time);
      last = time;
      t.push(String(y) + '/' + String(m))
    } while (last != e)

    let result = {};
    t.forEach(el => {
      result[el] = {
        news: [],
        totalScore: 0,
        totalMag: 0
      };

    })
    return result;
  }
}

function category2(start, end) {
  let startTime = new Date(start);
  let endTime = new Date(end);
  let s = String(startTime.getFullYear()) + (String(startTime.getMonth() + 1)) + String(startTime.getDate());
  let e = String(endTime.getFullYear()) + (String(endTime.getMonth() + 1)) + String(endTime.getDate());

  let y = startTime.getFullYear();
  let m = startTime.getMonth() + 1;
  let d = startTime.getDate();

  let t = [];
  t[0] = String(startTime.getFullYear()) + '/' + String(startTime.getMonth() + 1) + '/' + String(startTime.getDate());

  if (s == e) {
    let result = {};
    t.forEach(el => {
      result[el] = {
        news: [],
        totalScore: 0,
        totalMag: 0
      };
    })
    return result;
  } else {
    let last;
    do {
      d = d + 1;
      if (d == 32 && (m == 1 || m == 3 || m == 5 || m == 7 || m == 8 || m == 10 || m == 12)) {
        d = d - 31;
        m = m + 1;
      } else if (d == 31 && (m == 4 || m == 6 || m == 9 || m == 11)) {
        d = d - 30;
        m = m + 1
      } else if (d == 29 && m == 2) {
        d = d - 28;
        m = m + 1;
      }
      if (m == 13) {
        m = m - 12;
        y = y + 1;
      }
      let time = String(y) + String(m) + String(d);
      // time = Number(time);
      last = time;

      t.push(String(y) + '/' + String(m) + '/' + String(d));
    } while (last != e)

    let result = {};
    t.forEach(el => {
      result[el] = {
        news: [],
        totalScore: 0,
        totalMag: 0
      };

    })
    return result;
  }

}

function media(start, end, data) {
  if (data == false) {
    return false;
  } else {
    let timeCat = category(start, end);
    for (let i = 0; i < data.length; i++) {
      let time = new Date(data[i].date)
      let t = String(time.getFullYear()) + '/' + String(time.getMonth() + 1);
      timeCat[t].news.push(data[i]);
      timeCat[t].totalScore = timeCat[t].totalScore + Number(data[i].score);
      timeCat[t].totalMag = timeCat[t].totalMag + Number(data[i].magnitude);
    }
    return timeCat;
  }
}

function mediaDay(start, end, data) {
  if (data == false) {
    return false;
  } else {
    let timeCat = category2(start, end);
    for (let i = 0; i < data.length; i++) {
      let time = new Date(data[i].date)
      let t = String(time.getFullYear()) + '/' + String(time.getMonth() + 1) + '/' + String(time.getDate());
      timeCat[t].news.push(data[i]);
      timeCat[t].totalScore = timeCat[t].totalScore + Number(data[i].score);
      timeCat[t].totalMag = timeCat[t].totalMag + Number(data[i].magnitude);
    }
    return timeCat;
    // let timeCat = {};
    // for (let i = 0; i < data.length; i++) {
    //   let time = new Date(data[i].date)
    //   let t = String(time.getFullYear()) + '/' + (String(time.getMonth() + 1)) + '/' + String(time.getDate());
    //   if (timeCat[t] == undefined) {
    //     timeCat[t] = {
    //       news: [],
    //       totalScore: 0,
    //       totalMag: 0
    //     };
    //   } else {
    //     timeCat[t].news.push(data[i]);
    //     timeCat[t].totalScore = timeCat[t].totalScore + Number(data[i].score);
    //     timeCat[t].totalMag = timeCat[t].totalMag + Number(data[i].magnitude);
    //   }
    // }
    // return timeCat;
  }
}