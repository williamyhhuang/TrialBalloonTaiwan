const moment = require('moment');
const similarity = require('compute-cosine-similarity');

// 計算開始與結束時間的間隔 (月)
function calcMonth(start, end) {
  let startTime = moment(start).format('YYYY-MM');
  let endTime = moment(end).format('YYYY-MM');

  let monthSet = [];
  monthSet[0] = startTime;
  if (startTime == endTime) {
    let result = {};
    monthSet.forEach(el => {
      result[el] = {
        news: [],
        totalScore: 0,
        totalMag: 0
      };
    })
    return result;
  } else {
    let time = moment(startTime);
    let month;
    do {
      time = time.add(1, 'months');
      month = moment(time).format('YYYY-MM');
      monthSet.push(month);
    } while (month != endTime)

    let result = {};
    monthSet.forEach(el => {
      result[el] = {
        news: [],
        totalScore: 0,
        totalMag: 0
      };

    })
    return result;
  }
}
// 計算開始與結束時間的間隔 (日)
function calcDate(start, end) {
  let startTime = moment(start).format('YYYY-MM-DD');
  let endTime = moment(end).format('YYYY-MM-DD');

  let dateSet = [];
  dateSet[0] = startTime;
  if (startTime == endTime) {
    let result = {};
    dateSet.forEach(el => {
      result[el] = {
        news: [],
        totalScore: 0,
        totalMag: 0
      };
    })
    return result;
  } else {
    let time = moment(startTime);
    let date;
    do {
      time = time.add(1, 'days');
      date = moment(time).format('YYYY-MM-DD');
      dateSet.push(date);
    } while (date != endTime)

    let result = {};
    dateSet.forEach(el => {
      result[el] = {
        news: [],
        totalScore: 0,
        totalMag: 0
      };

    })
    return result;
  }
}
// 將資料依月份歸類
function categorizeNewsAsMonth(start, end, data) {
  if (data == false) {
    return false;
  } else {
    let timeCat = calcMonth(start, end);
    for (let i = 0; i < data.length; i++) {
      // 將日期的規格 YYYY/MM/DD 轉換為 YYYY-MM-DD
      let t = moment((data[i].date).replace(/\//g, '-')).format('YYYY-MM');
      timeCat[t].news.push(data[i]);
      timeCat[t].totalScore += Number(data[i].score);
      timeCat[t].totalMag += Number(data[i].magnitude);
    }
    return timeCat;
  }
}
// 將資料依日期歸類
function categorizeNewsAsDate(start, end, data) {
  if (data == false) {
    return false;
  } else {
    let timeCat = calcDate(start, end);
    for (let i = 0; i < data.length; i++) {
      // 將日期的規格 YYYY/MM/DD 轉換為 YYYY-MM-DD
      let t = moment((data[i].date).replace(/\//g, '-')).format('YYYY-MM-DD');
      timeCat[t].news.push(data[i]);
      timeCat[t].totalScore += Number(data[i].score);
      timeCat[t].totalMag += Number(data[i].magnitude);
    }
    return timeCat;
  }
}
// 根據每篇的新聞斷詞，比較新聞相似度，並挑出相似度最高的那篇
function comparison(cna, media) {

  if (media == false) {
    return false
  } else {
    let result = media[0];
    // 原斷詞資料為字串，須改為矩陣
    let max = calcSimilarity((cna.tokenize).split(','), (media[0].tokenize).split(','));
    for (let i = 0; i < media.length; i++) {
      let compare = calcSimilarity((cna.tokenize).split(','), (media[i].tokenize).split(','));
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
function calcSimilarity(str1, str2) {

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
module.exports = {
  calcMonth: calcMonth,
  calcDate: calcDate,
  categorizeNewsAsMonth: categorizeNewsAsMonth,
  categorizeNewsAsDate: categorizeNewsAsDate,
  comparison: comparison,
  calcSimilarity: calcSimilarity
}