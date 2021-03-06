/* eslint-disable require-jsdoc */
/* eslint-disable max-len */
const index = [];
const url = new URLSearchParams(location.href);
for (const [key, value] of url.entries()) {
  index.push(value);
}

const keyword = index[0];
const start = index[1];
const end = index[2];
const period = (new Date(end) - new Date(start));
const sixMonth = 15552000000;
const time = new Date(period);

if (period < 0) {
  window.alert('結束日期須大於開始日期');
  window.location = `${location.protocol}//${location.host}/media`;
} else if (time > sixMonth) {
  window.alert('查詢區間須小於六個月');
  window.location = `${location.protocol}//${location.host}/media`;
} else if (moment(start).isValid() == false || moment(end).isValid() == false) {
  window.alert('日期格式錯誤');
  window.location = `${location.protocol}//${location.host}/media`;
}

fetch(`${location.protocol}//${location.host}/api/media?keyword=${keyword}&start=${start}&end=${end}`)
    .then(function(response) {
      return response.json();
    })
    .then(function(data) {
      window.onload = loading(data);

      const content = document.getElementById('content');
      const hr = document.getElementById('hr');
      hr.innerHTML = '<hr>';
      const key = document.createElement('div');
      key.id = 'keyword';
      key.innerHTML = '<p>' + '關鍵字搜尋：' + data.keyword + '</p>';
      const start = document.createElement('div');
      start.id = 'start';
      start.innerHTML = '<p>' + '搜尋日期：' + data.start + ' ~ ' + data.end + '</p>';

      content.appendChild(key);
      content.appendChild(start);

      if (data.result == false) {
        const error = document.createElement('div');
        error.id = 'error';
        error.innerHTML = '<h2>' + '沒有關於該關鍵字的新聞' + '<h2>' + '<h2>' + '請更改關鍵字或稍後再搜尋' + '<h2>';
        content.style.height = 'calc(100vh - 28px  - 78px - 148px)';

        content.appendChild(error);
      } else {
        const content = document.getElementById('content');
        const month = data.monthSet;
        const cna = categorizeData(data.result.cna[0]);
        const chtimes = categorizeData(data.result.chtimes[0]);
        const ltn = categorizeData(data.result.ltn[0]);

        // 圖表div建立
        const container = document.createElement('div');
        container.className = 'chart-container';
        container.style.display = 'flex';
        const scoreDiv = document.createElement('div');
        const magDiv = document.createElement('div');
        const chartScore = document.createElement('canvas');
        const chartMag = document.createElement('canvas');
        scoreDiv.className = 'scoreDiv';
        magDiv.className = 'magDiv';
        chartScore.className = 'chart';
        chartMag.className = 'chart';
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
        append(scoreDiv, chartScore, scoreMark, scoreHint);
        append(magDiv, chartMag, magMark, magHint);

        container.appendChild(scoreDiv);
        container.appendChild(magDiv);
        content.appendChild(container);

        const myScoreChart = createScoreChart(chartScore, month, cna, chtimes, ltn);
        const myMagChart = createMagChart(chartMag, month, cna, chtimes, ltn);
        // 數據切換
        const switchBtn = document.createElement('div');
        switchBtn.className = 'change';
        switchBtn.innerHTML = '切換為日期';
        switchBtn.style.cursor = 'pointer';
        let check = false;
        switchBtn.addEventListener('click', function() {
          const month = data.monthSet;
          const cnaAsMonth = categorizeData(data.result.cna[0]);
          const chtimesAsMonth = categorizeData(data.result.chtimes[0]);
          const ltnAsMonth = categorizeData(data.result.ltn[0]);
          const date = data.dateSet;
          const cnaAsDate = categorizeData(data.result.cna[1]);
          const chtimesAsDate = categorizeData(data.result.chtimes[1]);
          const ltnAsDate = categorizeData(data.result.ltn[1]);

          if (check == false) {
            switchBtn.innerHTML = '切換為月份';
            check = true;
            changeScoreChart(myScoreChart, date, cnaAsDate, chtimesAsDate, ltnAsDate, true);
            changeMagChart(myMagChart, date, cnaAsDate, chtimesAsDate, ltnAsDate, true);
            changeChartStyle(myScoreChart, true);
            changeChartStyle(myMagChart, true);
          } else {
            switchBtn.innerHTML = '切換為日期';
            check = false;
            changeScoreChart(myScoreChart, month, cnaAsMonth, chtimesAsMonth, ltnAsMonth, false);
            changeMagChart(myMagChart, month, cnaAsMonth, chtimesAsMonth, ltnAsMonth, false);
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

        createTable('中央通訊社', data.result.cna[0], source);
        createTable('中時電子報', data.result.chtimes[0], source);
        createTable('自由電子報', data.result.ltn[0], source);

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
    document.getElementById('media_loader_div').style.display = 'none';
  }
}
// 將資料照月份/日期分類
function categorizeData(data) {
  const result = {};
  const month = Object.keys(data);
  const newsData = Object.values(data);

  for (let i = 0; i < month.length; i++) {
    let score;
    let magnitude;
    if ((newsData[i].news).length == 0) {
      score = 0;
      magnitude = 0;
    } else {
      score = (newsData[i].totalScore) / ((newsData[i].news).length);
      magnitude = (newsData[i].totalMag) / ((newsData[i].news).length);
    }
    result[month[i]] = {
      score: Number(score.toFixed(2)),
      magnitude: Number(magnitude.toFixed(2)),
    };
  }
  return result;
}
// 創建圖表
function createScoreChart(chart, month, cna, chtimes, ltn) {
  const cnaData = seperateData(cna);
  const chtimesData = seperateData(chtimes);
  const ltnData = seperateData(ltn);
  return new Chart(chart, {
    type: 'bar',
    data: {
      labels: month,
      datasets: [{
        type: 'line',
        label: '中央通訊社',
        yAxisID: 'Score',
        data: cnaData.score,
        pointBackgroundColor: 'rgba(255, 159, 64, 1)',
        pointRadius: 5,
        borderColor: 'rgba(255, 159, 64, 1)',
        borderDash: [5, 5],
        fill: false,
      }, {
        type: 'line',
        label: '中時電子報',
        yAxisID: 'Score',
        data: chtimesData.score,
        pointBackgroundColor: 'rgba(25, 159, 64, 1)',
        pointRadius: 5,
        borderColor: 'rgba(25, 159, 64, 1)',
        borderDash: [5, 5],
        fill: false,
      }, {
        type: 'line',
        label: '自由電子報',
        yAxisID: 'Score',
        data: ltnData.score,
        pointBackgroundColor: 'rgba(255, 15, 64, 1)',
        pointRadius: 5,
        borderColor: 'rgba(255, 15, 64, 1)',
        borderDash: [5, 5],
        fill: false,
      }],
    },
    options: {
      title: {
        display: true,
        text: '報社之時間與新聞情緒傾向關係圖',
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
            fontSize: 16,
          },
        }],
      },
    },
  });
}
function createMagChart(chart, month, cna, chtimes, ltn) {
  const cnaData = seperateData(cna);
  const chtimesData = seperateData(chtimes);
  const ltnData = seperateData(ltn);
  return new Chart(chart, {
    type: 'bar',
    data: {
      labels: month,
      datasets: [{
        type: 'line',
        label: '中央通訊社',
        yAxisID: 'Magnitude',
        data: cnaData.magnitude,
        pointBackgroundColor: 'rgba(255, 159, 64, 1)',
        pointRadius: 5,
        borderColor: 'rgba(255, 159, 64, 1)',
        fill: false,
      }, {
        type: 'line',
        label: '中時電子報',
        yAxisID: 'Magnitude',
        data: chtimesData.magnitude,
        pointBackgroundColor: 'rgba(25, 159, 64, 1)',
        pointRadius: 5,
        borderColor: 'rgba(25, 159, 64, 1)',
        fill: false,
      }, {
        type: 'line',
        label: '自由電子報',
        yAxisID: 'Magnitude',
        data: ltnData.magnitude,
        pointBackgroundColor: 'rgba(255, 15, 64, 1)',
        pointRadius: 5,
        borderColor: 'rgba(255, 15, 64, 1)',
        fill: false,
      }],
    },
    options: {
      title: {
        display: true,
        text: '報社之時間與新聞情緒強度關係圖',
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
            fontSize: 16,
          },
        }],
      },
    },
  });
}
// 切換圖表
function changeScoreChart(chart, date, cna, chtimes, ltn, check) {
  const cnaData = seperateData(cna);
  const chtimesData = seperateData(chtimes);
  const ltnData = seperateData(ltn);
  chart.data.labels = date;
  chart.data.datasets[0].data = cnaData.score;
  chart.data.datasets[1].data = chtimesData.score;
  chart.data.datasets[2].data = ltnData.score;
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
function changeMagChart(chart, date, cna, chtimes, ltn, check) {
  const cnaData = seperateData(cna);
  const chtimesData = seperateData(chtimes);
  const ltnData = seperateData(ltn);
  chart.data.labels = date;
  chart.data.datasets[0].data = cnaData.magnitude;
  chart.data.datasets[1].data = chtimesData.magnitude;
  chart.data.datasets[2].data = ltnData.magnitude;
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
function changeChartStyle(chart, set) {
  if (set == true) {
    chart.data.datasets[0].borderWidth = 1;
    chart.data.datasets[0].pointRadius = 2;
    chart.data.datasets[1].borderWidth = 1;
    chart.data.datasets[1].pointRadius = 2;
    chart.data.datasets[2].borderWidth = 1;
    chart.data.datasets[2].pointRadius = 2;
    chart.options.scales.xAxes[0].scaleLabel.labelString = '日期';
    chart.update();
  } else {
    chart.data.datasets[0].borderWidth = 3;
    chart.data.datasets[0].pointRadius = 5;
    chart.data.datasets[1].borderWidth = 3;
    chart.data.datasets[1].pointRadius = 5;
    chart.data.datasets[2].borderWidth = 3;
    chart.data.datasets[2].pointRadius = 5;
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
    for (let j = 0; j < newsData[i].news.length; j++) {
      news.push(newsData[i].news[j]);
    }
  }
  return news;
}
// 新增新聞表
function createTable(media, data, source) {
  let tableId;
  switch (media) {
    case ('中央通訊社'):
      tableId = 'cna';
      break;
    case ('自由電子報'):
      tableId = 'ltn';
      break;
    case ('中時電子報'):
      tableId = 'chtimes';
  }
  const mediaDiv = document.createElement('div');
  const res = collectNews(data);

  mediaDiv.innerHTML = `<a id=${tableId}Title><h3>${media} : 共 ${res.length} 則新聞</h3></a>`;
  mediaDiv.style.paddingLeft = '20px';
  mediaDiv.style.marginTop = '30px';
  // 整張表格
  const table = document.createElement('div');
  table.className = 'mediaTable';
  // 表格標題
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

  // 新增前五則新聞
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

  // 新增其餘新聞
  const subDiv = document.createElement('div');
  subDiv.id = tableId;
  subDiv.style.display = 'none';
  for (let j = 5; j < res.length; j++) {
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
    subDiv.appendChild(news);
  }
  table.appendChild(subDiv);

  // 新增切換訊息顯示按鈕
  const change = document.createElement('div');
  spreadBtn(change, tableId);
  append(source, mediaDiv, change, table);
}
