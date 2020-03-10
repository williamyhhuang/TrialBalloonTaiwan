/* eslint-disable require-jsdoc */
/* eslint-disable max-len */
const index = [];
const url = new URLSearchParams(location.href);

for (const [key, value] of url.entries()) {
  index.push(value);
}
const media1 = index[0];
const reporter1 = index[1];
const media2 = index[2];
const reporter2 = index[3];
const keyword = index[4];
const start = index[5];
const end = index[6];
const period = (new Date(end) - new Date(start));
const sixMonth = 15552000000;
const time = new Date(period);

if (period < 0) {
  window.alert('結束日期須大於開始日期');
  window.location = `${location.protocol}//${location.host}/reporter`;
} else if (time > sixMonth) {
  window.alert('查詢區間須小於六個月');
  window.location = `${location.protocol}//${location.host}/reporter`;
} else if (moment(start).isValid() == false || moment(end).isValid() == false) {
  window.alert('日期格式錯誤');
  window.location = `${location.protocol}//${location.host}/reporter`;
}

fetch(`${location.protocol}//${location.host}/api/reporter?media1=${media1}&reporter1=${reporter1}&media2=${media2}&reporter2=${reporter2}&keyword=${keyword}&start=${start}&end=${end}`)
    .then(function(response) {
      return response.json();
    })
    .then(function(data) {
      window.onload = loading(data);
      const content = document.getElementById('content');
      const hr = document.getElementById('hr');
      hr.innerHTML = '<hr>';
      const reporter = document.createElement('div');
      reporter.id = 'reporter';
      reporter.innerHTML = '<p>' + switchMediaName(data.reporter1[0]) + ' - ' + data.reporter1[1] + ' VS ' + switchMediaName(data.reporter2[0]) + ' - ' + data.reporter2[1] + '</p>';
      const key = document.createElement('div');
      key.id = 'keyword';
      key.innerHTML = '<p>' + '關鍵字搜尋：' + data.keyword + '</p>';
      const start = document.createElement('div');
      start.id = 'start';
      start.innerHTML = '<p>' + '搜尋日期：' + data.start + ' ~ ' + data.end + '</p>';

      content.appendChild(reporter);
      content.appendChild(key);
      content.appendChild(start);

      if (data.result == false) {
        const error = document.createElement('div');
        error.id = 'error';
        error.innerHTML = '<h2>' + '沒有關於該關鍵字的新聞' + '<h2>' + '<h2>' + '請更改關鍵字或稍後再搜尋' + '<h2>';
        content.style.height = 'calc(100vh - 28px  - 78px - 190px)';
        content.appendChild(error);
      } else {
        const month = data.monthSet;
        // 記者的 Score 及 Magnitude 分數
        const reporter1Data = categorizeData(data.result.reporter1[0]);
        const reporter2Data = categorizeData(data.result.reporter2[0]);

        // 圖表div建立
        const container = document.createElement('div');
        container.className = 'chart-container';
        container.style.display = 'flex';
        const scoreDiv = document.createElement('div');
        const magDiv = document.createElement('div');
        const scoreChart = document.createElement('canvas');
        const magChart = document.createElement('canvas');
        scoreDiv.className = 'scoreDiv';
        magDiv.className = 'magDiv';
        scoreChart.className = 'chart';
        magChart.className = 'chart';
        // 新增提示
        const scoreMark = document.createElement('div');
        scoreMark.className='qMark';
        scoreMark.innerHTML = '?';
        const scoreHint = document.createElement('div');
        scoreHint.className = 'hint';
        scoreHint.innerHTML = '<p style="margin: 5px;">Score : 範圍介於 -1.0 和 1.0 之間，可反映文字的整體情緒傾向。</p>';
        const magMark = document.createElement('div');
        magMark.className='qMark';
        magMark.innerHTML = '?';
        const magHint = document.createElement('div');
        magHint.className = 'hint';
        magHint.innerHTML = '<p style="margin: 5px;">Magnitude : 範圍介於 0.0 和 +inf 之間，表示文字的整體情緒強度。</p>';
        append(scoreDiv, scoreChart, scoreMark, scoreHint);
        append(magDiv, magChart, magMark, magHint);

        container.appendChild(scoreDiv);
        container.appendChild(magDiv);
        content.appendChild(container);

        const myScoreChart = createScoreChart(scoreChart, month, reporter1Data, reporter2Data, data.reporter1[1], data.reporter2[1]);
        const myMagChart = createMagChart(magChart, month, reporter1Data, reporter2Data, data.reporter1[1], data.reporter2[1]);

        // 數據切換
        const switchBtn = document.createElement('div');
        switchBtn.className = 'change';
        switchBtn.innerHTML = '切換為日期';
        switchBtn.style.cursor = 'pointer';
        let check = false;
        switchBtn.addEventListener('click', function() {
          const month = data.monthSet;
          const reporter1DataAsMonth = categorizeData(data.result.reporter1[0]);
          const reporter2DataAsMonth = categorizeData(data.result.reporter2[0]);

          const date = data.dateSet;
          const reporter1DataAsDate = categorizeData(data.result.reporter1[1]);
          const reporter2DataAsDate = categorizeData(data.result.reporter2[1]);

          if (check == false) {
            switchBtn.innerHTML = '切換為月份';
            check = true;
            changeScoreChart(myScoreChart, date, reporter1DataAsDate, reporter2DataAsDate, true);
            changeMagChart(myMagChart, date, reporter1DataAsDate, reporter2DataAsDate, true);
            changeChartStyle(myScoreChart, true);
            changeChartStyle(myMagChart, true);
          } else {
            switchBtn.innerHTML = '切換為日期';
            check = false;
            changeScoreChart(myScoreChart, month, reporter1DataAsMonth, reporter2DataAsMonth, false);
            changeMagChart(myMagChart, month, reporter1DataAsMonth, reporter2DataAsMonth, false);
            changeChartStyle(myScoreChart, false);
            changeChartStyle(myMagChart, false);
          }
        });
        content.appendChild(switchBtn);

        // 參數說明
        const instance = document.createElement('div');
        instance.id = 'instance';
        instance.innerHTML = '<h2>分析值說明 : </h2><ul><li>上述圖表所顯示的資訊為當天/月關於該關鍵字平均每篇新聞之分析值。</li><li>Score : 範圍介於 -1.0 (負面) 和 1.0 (正面) 之間，可反映文字的整體情緒傾向。</li><li>Magnitude : 表示文字的整體情緒強度，介於 0.0 和 +inf 之間。只要文字內容出現情緒用字都會提高文字的 magnitude 值。</li><li>若該日期之 score 及 magnitude 值皆為零，極有可能當天該報社/記者沒有相關關鍵字的新聞。</li><li>詳細說明請參考<a href="https://cloud.google.com/natural-language/docs/basics?hl=zh-tw"> GOOGLE - NLP</a></li></ul>';
        content.appendChild(instance);

        // 資料來源
        const source = document.createElement('div');
        source.style.margin = '0px 20px';
        source.innerHTML = '<h2 id="source">資料來源 :</h2>';
        createTable(data.reporter1, data.result.reporter1[0], source);
        createTable(data.reporter2, data.result.reporter2[0], source);

        // 新增回到置頂按鈕
        const goTop = document.createElement('div');
        goTopBtn(goTop);

        content.appendChild(source);
        content.appendChild(goTop);
        goTop.onscroll = scroll();
        goTop.style.display = 'none';
      }
    });

// //// 以下為 function //////
// 顯示 goTop 按鈕
function scroll() {
  window.addEventListener('scroll', function(e) {
    const position = window.scrollY;
    if (position >= 500) {
      document.getElementById('goTop').style.display = 'block';
    } else {
      document.getElementById('goTop').style.display = 'none';
    }
  });
}
// 將 Score 及 Magnitude 分類成兩個矩陣，用在圖表呈現
function seperateData(data) {
  const set = Object.values(data);
  const score = [];
  const mag = [];
  for (let i = 0; i < set.length; i++) {
    score.push(set[i].score);
    mag.push(set[i].magnitude);
  }
  return {
    score: score,
    magnitude: mag,
  };
}
// 載入動畫
function loading(data) {
  if (data != undefined) {
    document.getElementById('reporter_loader_div').style.display = 'none';
  }
}
// 將資料照月份/日期分類
function categorizeData(data) {
  const result = {};
  const date = Object.keys(data);
  const newsData = Object.values(data);

  for (let i = 0; i < date.length; i++) {
    let score;
    let magnitude;
    if ((newsData[i].news).length == 0) {
      score = 0;
      magnitude = 0;
    } else {
      score = (newsData[i].totalScore) / ((newsData[i].news).length);
      magnitude = (newsData[i].totalMag) / ((newsData[i].news).length);
    }
    result[date[i]] = {
      score: Number(score.toFixed(2)),
      magnitude: Number(magnitude.toFixed(2)),
    };
  }
  return result;
}
// 建立圖表
function createScoreChart(chart, month, reporter1Data, reporter2Data, reporter1Name, reporter2Name) {
  const reporter1DataResult = seperateData(reporter1Data);
  const reporter2DataResult = seperateData(reporter2Data);

  return new Chart(chart, {
    type: 'bar',
    data: {
      labels: month,
      datasets: [{
        type: 'line',
        label: reporter1Name + ' - Score',
        yAxisID: 'Score',
        data: reporter1DataResult.score,
        pointBackgroundColor: 'rgba(255, 255, 255, 1)',
        pointBorderColor: 'rgba(255, 159, 64, 1)',
        pointBorderWidth: 2,
        pointRadius: 7,
        pointStyle: 'circle',
        borderColor: 'rgba(255, 159, 64, 1)',
        borderDash: [5, 5],
        fill: false,
      }, {
        type: 'line',
        label: reporter2Name + ' - Score',
        yAxisID: 'Score',
        data: reporter2DataResult.score,
        pointBackgroundColor: 'rgba(255, 255, 255, 1)',
        pointBorderColor: 'rgba(25, 159, 64, 1)',
        pointBorderWidth: 2,
        pointRadius: 7,
        pointStyle: 'circle',
        borderColor: 'rgba(25, 159, 64, 1)',
        borderDash: [5, 5],
        fill: false,
      }],
    },
    options: {
      title: {
        display: true,
        text: '記者之時間與新聞情緒傾向關係圖',
        fontSize: 18,
        fontStyle: 'bold',
      },
      scales: {
        xAxes: [{
          type: 'time',
          time: {
            unit: 'month',
            parser: 'YYYY/MM',
            stepSize: 1,
            displayFormats: {
              month: 'YYYY-MM',
            },
          },
          ticks: {
            beginAtZero: false,
          },
          scaleLabel: {
            display: true,
            labelString: '月份',
            fontSize: 16,
          },
        }],
        yAxes: [{
          id: 'Score',
          type: 'linear',
          position: 'left',
          ticks: {
            max: 0.5,
            min: -0.5,
          },
          scaleLabel: {
            display: true,
            labelString: '整體情緒傾向',
            // fontStyle: 'bold',
            fontSize: 16,
          },
        }],
      },
    },
  });
}
function createMagChart(chart, month, reporter1Data, reporter2Data, reporter1Name, reporter2Name) {
  const reporter1DataResult = seperateData(reporter1Data);
  const reporter2DataResult = seperateData(reporter2Data);

  return new Chart(chart, {
    type: 'bar',
    data: {
      labels: month,
      datasets: [{
        type: 'line',
        label: reporter1Name + ' - Magnitude',
        yAxisID: 'Magnitude',
        data: reporter1DataResult.magnitude,
        pointBackgroundColor: 'rgba(255, 159, 64, 1)',
        pointRadius: 5,
        borderColor: 'rgba(255, 159, 64, 1)',
        fill: false,
      }, {
        type: 'line',
        label: reporter2Name + ' - Magnitude',
        yAxisID: 'Magnitude',
        data: reporter2DataResult.magnitude,
        pointBackgroundColor: 'rgba(25, 159, 64, 1)',
        pointRadius: 5,
        borderColor: 'rgba(25, 159, 64, 1)',
        fill: false,
      }],
    },
    options: {
      title: {
        display: true,
        text: '記者之時間與新聞情緒分析關係圖',
        fontSize: 18,
        fontStyle: 'bold',
      },
      scales: {
        xAxes: [{
          type: 'time',
          time: {
            unit: 'month',
            parser: 'YYYY/MM',
            stepSize: 1,
            displayFormats: {
              month: 'YYYY-MM',
            },
          },
          ticks: {
            beginAtZero: false,
          },
          scaleLabel: {
            display: true,
            labelString: '月份',
            fontSize: 16,
          },
        }],
        yAxes: [{
          id: 'Magnitude',
          type: 'linear',
          position: 'left',
          ticks: {
            beginAtZero: true,
            stepSize: 2.4,
            max: 12,
            min: 0,
          },
          scaleLabel: {
            display: true,
            labelString: '整體情緒強度',
            // fontStyle: 'bold',
            fontSize: 16,
          },
        }],
      },
    },
  });
}
// 切換圖表
function changeScoreChart(chart, date, reporter1Data, reporter2Data, check) {
  const reporter1DataResult = seperateData(reporter1Data);
  const reporter2DataResult = seperateData(reporter2Data);

  chart.data.labels = date;
  chart.data.datasets[0].data = reporter1DataResult.score;
  chart.data.datasets[1].data = reporter2DataResult.score;
  if (check) {
    chart.options.scales.xAxes[0].time = {
      unit: 'day',
      stepSize: 7,
      parser: 'YYYY/MM/DD',
      displayFormats: {
        day: 'YYYY-M-DD',
      },
    };
  } else if (check == false) {
    chart.options.scales.xAxes[0].time = {
      unit: 'month',
      stepSize: 1,
      parser: 'YYYY/MM',
      displayFormats: {
        month: 'YYYY-MM',
      },
    };
  }
  chart.update();
}
function changeMagChart(chart, date, reporter1Data, reporter2Data, check) {
  const reporter1DataResult = seperateData(reporter1Data);
  const reporter2DataResult = seperateData(reporter2Data);

  chart.data.labels = date;
  chart.data.datasets[0].data = reporter1DataResult.magnitude;
  chart.data.datasets[1].data = reporter2DataResult.magnitude;
  if (check) {
    chart.options.scales.xAxes[0].time.unit = 'day';
    chart.options.scales.xAxes[0].time.stepSize = 7;
    chart.options.scales.xAxes[0].time.parser = 'YYYY/MM/DD';
    chart.options.scales.xAxes[0].time.displayFormats = {
      day: 'YYYY-M-DD',
    };
  } else if (check == false) {
    chart.options.scales.xAxes[0].time.unit = 'month';
    chart.options.scales.xAxes[0].time.stepSize = 1;
    chart.options.scales.xAxes[0].time.parser = 'YYYY/MM';
    chart.options.scales.xAxes[0].time.displayFormats = {
      month: 'YYYY-MM',
    };
  }
  chart.update();
}
function changeChartStyle(chart, check) {
  if (check == true) {
    chart.data.datasets[0].borderWidth = 1;
    chart.data.datasets[0].pointRadius = 2;
    chart.data.datasets[1].borderWidth = 1;
    chart.data.datasets[1].pointRadius = 2;
    chart.options.scales.xAxes[0].scaleLabel.labelString = '日期';
    chart.update();
  } else {
    chart.data.datasets[0].borderWidth = 3;
    chart.data.datasets[0].pointRadius = 5;
    chart.data.datasets[1].borderWidth = 3;
    chart.data.datasets[1].pointRadius = 5;
    chart.options.scales.xAxes[0].scaleLabel.labelString = '月份';
    chart.update();
  }
}
// 將所有新聞整理到一個矩陣裡
function collectNews(data) {
  const month = Object.keys(data);
  const newsData = Object.values(data);

  const news = [];
  for (let i = 0; i < month.length; i++) {
    if (newsData[i].news.length == 0) {
      continue;
    }
    for (let j = 0; j < newsData[i].news.length; j++) {
      news.push(newsData[i].news[j]);
    }
  }
  return news;
}
// 新增新聞表
function createTable(reporter, data, source) {
  let tableId;
  const media = reporter[0];
  let name;
  switch (media) {
    case ('cna'):
      tableId = 'cna';
      name = '中央通訊社';
      break;
    case ('ltn'):
      tableId = 'ltn';
      name = '自由電子報';
      break;
    case ('chtimes'):
      tableId = 'chtimes';
      name = '中時電子報';
  }
  const mediaDiv = document.createElement('div');
  const res = collectNews(data);
  mediaDiv.innerHTML = `<a id=${name}><h3>${name} - ${reporter[1]} : 共 ${res.length} 則新聞</h3></a>`;
  mediaDiv.style.paddingLeft = '20px';
  mediaDiv.style.marginTop = '30px';
  // 整張表格
  const table = document.createElement('div');
  table.className = 'reporterTable';
  const top = document.createElement('div');
  top.style.display = 'flex';
  const date = document.createElement('div');
  createTableTitle_date(date, '時間');
  const title = document.createElement('div');
  createTableTitle_title(title, '標題');
  const url = document.createElement('div');
  createTableTitle_url(url, '連結');
  const score = document.createElement('div');
  createTableTitle_score(score, 'Score');
  const mag = document.createElement('div');
  createTableTitle_mag(mag, 'Magnitude');
  append(top, date, title, url, score, mag);
  table.appendChild(top);

  // 新增新聞
  for (let j = 0; j < 5; j++) {
    if (res[j] == null) {
      break;
    }
    const news = document.createElement('div');
    news.style.display = 'flex';
    news.style.justifyContent = 'space-around';
    const dateDiv = document.createElement('div');
    const date = res[j].date;
    createTable_date(dateDiv, date);
    const titleDiv = document.createElement('div');
    const title = res[j].title;
    createTable_title(titleDiv, title);
    const urlDiv = document.createElement('div');
    const url = res[j].url;
    createTable_url(urlDiv, url);
    const scoreDiv = document.createElement('div');
    const score = Number(res[j].score).toFixed(2);
    createTable_score(scoreDiv, score);
    const magDiv = document.createElement('div');
    const mag = Number(res[j].magnitude).toFixed(2);
    createTable_mag(magDiv, mag);

    append(news, dateDiv, titleDiv, urlDiv, scoreDiv, magDiv);
    table.appendChild(news);
  }

  const subDiv = document.createElement('div');
  subDiv.id = tableId;
  subDiv.style.display = 'none';
  for (let j = 5; j < res.length; j++) {
    const news = document.createElement('div');
    news.style.display = 'flex';
    news.style.justifyContent = 'space-around';
    const dateDiv = document.createElement('div');
    const date = res[j].date;
    createTable_date(dateDiv, date);
    const titleDiv = document.createElement('div');
    const title = res[j].title;
    createTable_title(titleDiv, title);
    const url = res[j].url;
    const urlDiv = document.createElement('div');
    createTable_url(urlDiv, url);
    const score = Number(res[j].score).toFixed(2);
    const scoreDiv = document.createElement('div');
    createTable_score(scoreDiv, score);
    const magDiv = document.createElement('div');
    const mag = Number(res[j].magnitude).toFixed(2);
    createTable_mag(magDiv, mag);

    append(news, dateDiv, titleDiv, urlDiv, scoreDiv, magDiv);
    subDiv.appendChild(news);
  }
  table.appendChild(subDiv);

  // 新增切換訊息顯示按鈕
  const change = document.createElement('div');
  change.id = 'changeTable';
  change.innerHTML = '展開以顯示全部';
  let checkTable = false;
  change.addEventListener('click', function() {
    if (checkTable == false) {
      change.innerHTML = '收合';
      checkTable = true;
      document.getElementById(tableId).style.display = 'block';
    } else {
      change.innerHTML = '展開以顯示全部';
      checkTable = false;
      document.getElementById(tableId).style.display = 'none';
    }
  });

  source.appendChild(mediaDiv);
  source.appendChild(change);
  source.appendChild(table);
}
// 切換媒體名字
function switchMediaName(name) {
  switch (name) {
    case ('cna'):
      return '中央通訊社';
    case ('ltn'):
      return '自由電子報';
    case ('chtimes'):
      return '中時電子報';
  }
}
