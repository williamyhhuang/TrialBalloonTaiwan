let index = [];
let url = new URLSearchParams(location.href);
let host = location.host;
let protocol = location.protocol;
for (let [key, value] of url.entries()) {
  index.push(value)
}

let keyword = index[0];
let start = index[1];
let end = index[2];


fetch(`http://${host}/api/media?keyword=${keyword}&start=${start}&end=${end}`)
  .then(function (response) {
    return response.json();
  })
  .then(function (data) {

    window.onload = loading(data);

    let hr = document.getElementById('hr');
    hr.innerHTML = '<hr>';
    let key = document.createElement('div');
    key.id = 'keyword';
    key.innerHTML = '<p>' + '關鍵字搜尋：' + data.keyword + '</p>';
    let start = document.createElement('div');
    start.id = 'start';
    start.innerHTML = '<p>' + '搜尋日期：' + data.start + ' ~ ' + data.end + '</p>';

    document.body.appendChild(key);
    document.body.appendChild(start);

    if (data.result == false) {
      let error = document.createElement('div');
      error.id = 'error'
      error.innerHTML = '<h1>' + '沒有關於該關鍵字的新聞，請更改關鍵字或稍後再搜尋' + '<h1>';
      document.body.appendChild(error);
    } else {

      let month = Object.keys(data.result.cna[0]);
      let cna = mediaData(data.result.cna[0]);
      let chtimes = mediaData(data.result.chtimes[0]);
      let ltn = mediaData(data.result.ltn[0]);

      // 圖表div建立
      let container = document.createElement('div');
      container.className = 'chart-container';
      container.style.display = 'flex';
      let scoreDiv = document.createElement('div');
      let magDiv = document.createElement('div');
      let chartScore = document.createElement('canvas');
      let chartMag = document.createElement('canvas');
      scoreDiv.className = 'scoreDiv';
      magDiv.className = 'magDiv';
      chartScore.className = 'chart';
      chartMag.className = 'chart';
      scoreDiv.appendChild(chartScore);
      magDiv.appendChild(chartMag);
      container.appendChild(scoreDiv);
      container.appendChild(magDiv);
      document.body.appendChild(container);
      let myScoreChart = createScoreChart(chartScore, month, cna, chtimes, ltn);
      let myMagChart = createMagChart(chartMag, month, cna, chtimes, ltn);
      // 數據切換
      let but = document.createElement('div');
      but.className = 'change';
      but.innerHTML = '切換為日期';
      but.style.cursor = 'pointer';
      let check = false;
      but.addEventListener('click', function () {
        let month = Object.keys(data.result.cna[0]);
        let cna = mediaData(data.result.cna[0]);
        let chtimes = mediaData(data.result.chtimes[0]);
        let ltn = mediaData(data.result.ltn[0]);
        let date = Object.keys(data.result.cna[1]);
        let cna2 = mediaData(data.result.cna[1]);
        let chtimes2 = mediaData(data.result.chtimes[1]);
        let ltn2 = mediaData(data.result.ltn[1]);

        if (check == false) {
          but.innerHTML = '切換為月份';
          check = true;
          changeScoreChart(myScoreChart, date, cna2, chtimes2, ltn2, true);
          changeMagChart(myMagChart, date, cna2, chtimes2, ltn2, true);
          changeChartStyle(myScoreChart, true);
          changeChartStyle(myMagChart, true);
        } else {
          but.innerHTML = '切換為日期';
          check = false;
          changeScoreChart(myScoreChart, month, cna, chtimes, ltn, false);
          changeMagChart(myMagChart, month, cna, chtimes, ltn, false);
          changeChartStyle(myScoreChart, false);
          changeChartStyle(myMagChart, false);
        }
      })
      document.body.appendChild(but);
      // 參數說明
      let instance = document.createElement('div');
      instance.id = 'instance';
      instance.innerHTML = '<h2>分析值說明 : </h2><ul><li>上述圖表所顯示的資訊為當天/月關於該關鍵字平均每篇新聞之分析值。</li><li>Score : 範圍介於 -1.0 (負面) 和 1.0 (正面) 之間，可反映文字的整體情緒傾向。</li><li>Magnitude : 表示文字的整體情緒強度，介於 0.0 和 +inf 之間。只要文字內容出現情緒用字都會提高文字的 magnitude 值。</li><li>若該日期之 score 及 magnitude 值皆為零，極有可能當天該報社/記者沒有相關關鍵字的新聞。</li><li>詳細說明請參考<a href="https://cloud.google.com/natural-language/docs/basics?hl=zh-tw"> GOOGLE - NLP</a></li></ul>';
      document.body.appendChild(instance);
      // 資料來源
      let source = document.createElement('div');
      source.style.margin = '0px 20px'
      source.innerHTML = '<h2>資料來源 :</h2>';

      createTable('中央通訊社', data.result.cna[0], source);
      createTable('中時電子報', data.result.chtimes[0], source);
      createTable('自由電子報', data.result.ltn[0], source);

      // 新增回到置頂按鈕
      let goTop = document.createElement('div');
      goTop.className = 'goTop';
      let a = document.createElement('a');
      a.href = `#cnaTitle`;
      a.innerHTML = 'Go Top';
      goTop.appendChild(a)
      document.body.appendChild(source);
      document.body.appendChild(goTop);
    }
  })

function collect(data) {
  let set = Object.values(data);
  let score = [];
  let mag = [];
  for (let i = 0; i < set.length; i++) {
    score.push(set[i].score);
    mag.push(set[i].magnitude);
  }
  return {
    score: score,
    magnitude: mag
  }
}

function loading(data) {
  if (data != undefined) {
    document.getElementById('loader').style.display = 'none';
  }
}

function mediaData(data) {
  let result = {};
  let month = Object.keys(data);
  let newsData = Object.values(data);

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
      magnitude: Number(magnitude.toFixed(2))
    }
  }
  return result;
}

function createScoreChart(chart, month, cna, chtimes, ltn) {
  let cnaData = collect(cna);
  let chtimesData = collect(chtimes);
  let ltnData = collect(ltn);
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
      },]
    },
    options: {
      title: {
        display: true,
        text: '報社之時間與新聞情緒傾向關係圖',
        fontSize: 20,
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
              month: 'YYYY-MM'
            }
          },
          ticks: {
            beginAtZero: false,
          },
          scaleLabel: {
            display: true,
            labelString: '月份',
            fontSize: 20
          }
        }],
        yAxes: [{
          id: 'Score',
          type: 'linear',
          position: 'left',
          ticks: {
            max: 0.5,
            min: -0.5
          },
          scaleLabel: {
            display: true,
            labelString: '整體情緒傾向',
            fontSize: 20
          }
        }]
      }
    }
  });
}

function createMagChart(chart, month, cna, chtimes, ltn) {
  let cnaData = collect(cna);
  let chtimesData = collect(chtimes);
  let ltnData = collect(ltn);
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
      }]
    },
    options: {
      title: {
        display: true,
        text: '報社之時間與新聞情緒強度關係圖',
        fontSize: 20,
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
              month: 'YYYY-MM'
            }
          },
          ticks: {
            beginAtZero: false,
          },
          scaleLabel: {
            display: true,
            labelString: '月份',
            fontSize: 20
          }
        }],
        yAxes: [{
          id: 'Magnitude',
          type: 'linear',
          position: 'left',
          ticks: {
            beginAtZero: true,
            stepSize: 2.4,
            max: 12,
            min: 0
          },
          scaleLabel: {
            display: true,
            labelString: '整體情緒強度',
            fontSize: 20
          }
        }]
      }
    }
  });
}

function changeScoreChart(chart, date, cna, chtimes, ltn, check) {
  let cnaData = collect(cna);
  let chtimesData = collect(chtimes);
  let ltnData = collect(ltn);
  chart.data.labels = date;
  chart.data.datasets[0].data = cnaData.score;
  chart.data.datasets[1].data = chtimesData.score;
  chart.data.datasets[2].data = ltnData.score;
  if (check) {
    chart.options.scales.xAxes[0].time.unit = 'day';
    chart.options.scales.xAxes[0].time.stepSize = 7;
    chart.options.scales.xAxes[0].time.parser = 'YYYY/MM/DD';
    chart.options.scales.xAxes[0].time.displayFormats = {
      day: 'YYYY-M-DD'
    };
  } else if (check == false) {
    chart.options.scales.xAxes[0].time.unit = 'month';
    chart.options.scales.xAxes[0].time.stepSize = 1;
    chart.options.scales.xAxes[0].time.parser = 'YYYY/MM';
    chart.options.scales.xAxes[0].time.displayFormats = {
      month: 'YYYY-MM'
    };
  }
  chart.update()
}

function changeMagChart(chart, date, cna, chtimes, ltn, check) {
  let cnaData = collect(cna);
  let chtimesData = collect(chtimes);
  let ltnData = collect(ltn);
  chart.data.labels = date;
  chart.data.datasets[0].data = cnaData.magnitude;
  chart.data.datasets[1].data = chtimesData.magnitude;
  chart.data.datasets[2].data = ltnData.magnitude;
  if (check) {
    chart.options.scales.xAxes[0].time.unit = 'day';
    chart.options.scales.xAxes[0].time.stepSize = 7;
    chart.options.scales.xAxes[0].time.parser = 'YYYY/MM/DD';
    chart.options.scales.xAxes[0].time.displayFormats = {
      day: 'YYYY-M-DD'
    };
  } else if (check == false) {
    chart.options.scales.xAxes[0].time.unit = 'month';
    chart.options.scales.xAxes[0].time.stepSize = 1;
    chart.options.scales.xAxes[0].time.parser = 'YYYY/MM';
    chart.options.scales.xAxes[0].time.displayFormats = {
      month: 'YYYY-MM'
    };
  }
  chart.update()
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
  let month = Object.keys(data);
  let newsData = Object.values(data);
  let news = [];
  for (let i = 0; i < month.length; i++) {
    for (let j = 0; j < newsData[i].news.length; j++) {
      news.push(newsData[i].news[j])
    }
  }
  return news;
}

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
  let mediaDiv = document.createElement('div');
  let res = collectNews(data);
  mediaDiv.innerHTML = `<a id=${tableId}Title><h3>${media} : 共 ${res.length} 則新聞</h3></a>`
  mediaDiv.style.paddingLeft = '20px';
  mediaDiv.style.marginTop = '30px';
  let table = document.createElement('div');
  table.className = 'table';
  table.style.flexDirection = 'column';
  table.style.borderWidth = '3px';
  table.style.marginBottom = '50px';
  table.style.width = '95%';
  let top = document.createElement('div');
  top.style.display = 'flex';
  let time = document.createElement('div');
  time.innerHTML = '時間';
  time.className = 'mediaTable';
  time.style.borderRightStyle = 'solid';
  time.style.borderBottomStyle = 'solid';
  time.style.width = '22%';
  let title = document.createElement('div');
  title.innerHTML = '標題';
  title.className = 'mediaTable';
  title.style.width = '100%';
  title.style.borderRightStyle = 'solid';
  title.style.borderBottomStyle = 'solid';
  let url = document.createElement('div');
  url.innerHTML = '連結';
  url.className = 'mediaTable';
  url.style.width = '100%';
  url.style.borderRightStyle = 'solid';
  url.style.borderBottomStyle = 'solid';
  let score = document.createElement('div');
  score.innerHTML = 'Score';
  score.className = 'mediaTable';
  score.style.width = '20%';
  score.style.borderRightStyle = 'solid';
  score.style.borderBottomStyle = 'solid';
  let mag = document.createElement('div');
  mag.innerHTML = 'Magnitude';
  mag.className = 'mediaTable';
  mag.style.width = '20%';
  mag.style.borderBottomStyle = 'solid';
  top.appendChild(time);
  top.appendChild(title);
  top.appendChild(url);
  top.appendChild(score);
  top.appendChild(mag);
  table.appendChild(top);

  // 新增新聞
  for (let j = 0; j < 5; j++) {
    let news = document.createElement('div');
    news.style.display = 'flex';
    news.style.justifyContent = 'space-around';
    let dateDiv = document.createElement('div');
    dateDiv.className = 'mediaTable';
    dateDiv.style.width = '22%';
    dateDiv.style.padding = '2px 0px';
    let titleDiv = document.createElement('div');
    titleDiv.className = 'mediaTable';
    titleDiv.style.width = '100%';
    titleDiv.style.padding = '2px 0px';
    titleDiv.style.borderLeftStyle = 'solid';
    titleDiv.style.borderRightStyle = 'solid';
    let urlDiv = document.createElement('div');
    urlDiv.className = 'mediaTable';
    urlDiv.style.width = '100%';
    urlDiv.style.padding = '2px 0px';
    let scoreDiv = document.createElement('div');
    scoreDiv.className = 'mediaTable';
    scoreDiv.style.width = '20%';
    scoreDiv.style.padding = '2px 0px';
    scoreDiv.style.borderLeftStyle = 'solid';
    scoreDiv.style.borderRightStyle = 'solid';
    let magDiv = document.createElement('div');
    magDiv.className = 'mediaTable';
    magDiv.style.width = '20%';
    magDiv.style.padding = '2px 0px';
    let date = res[j].date;
    let title = res[j].title;
    let url = res[j].url;
    let score = Number(res[j].score).toFixed(2);
    let mag = Number(res[j].magnitude).toFixed(2);
    dateDiv.innerHTML = date;
    titleDiv.innerHTML = title;
    // urlDiv.innerHTML = url;
    scoreDiv.innerHTML = score;
    magDiv.innerHTML = mag;
    let a = document.createElement('a');
    a.href = `${url}`;
    a.target = '_blank';
    a.style.textDecoration = 'none';
    a.style.wordBreak = 'break-all';
    let data = document.createTextNode(url);
    a.appendChild(data);
    urlDiv.appendChild(a);
    news.appendChild(dateDiv);
    news.appendChild(titleDiv);
    news.appendChild(urlDiv);
    news.appendChild(scoreDiv);
    news.appendChild(magDiv);
    table.appendChild(news);
  }
  let subDiv = document.createElement('div');
  subDiv.id = tableId;
  subDiv.style.display = 'none';
  for (let j = 5; j < res.length; j++) {
    let news = document.createElement('div');
    news.style.display = 'flex';
    news.style.justifyContent = 'space-around';
    let dateDiv = document.createElement('div');
    dateDiv.className = 'mediaTable';
    dateDiv.style.width = '30%';
    dateDiv.style.padding = '2px 0px';
    let titleDiv = document.createElement('div');
    titleDiv.className = 'mediaTable';
    titleDiv.style.width = '100%';
    titleDiv.style.padding = '2px 0px';
    titleDiv.style.borderLeftStyle = 'solid';
    titleDiv.style.borderRightStyle = 'solid';
    let urlDiv = document.createElement('div');
    urlDiv.className = 'mediaTable';
    urlDiv.style.width = '100%';
    urlDiv.style.padding = '2px 0px';
    let scoreDiv = document.createElement('div');
    scoreDiv.className = 'mediaTable';
    scoreDiv.style.width = '20%';
    scoreDiv.style.padding = '2px 0px';
    scoreDiv.style.borderLeftStyle = 'solid';
    scoreDiv.style.borderRightStyle = 'solid';
    let magDiv = document.createElement('div');
    magDiv.className = 'mediaTable';
    magDiv.style.width = '20%';
    magDiv.style.padding = '2px 0px';
    let date = res[j].date;
    let title = res[j].title;
    let url = res[j].url;
    let score = Number(res[j].score).toFixed(2);
    let mag = Number(res[j].magnitude).toFixed(2);
    dateDiv.innerHTML = date;
    titleDiv.innerHTML = title;
    scoreDiv.innerHTML = score;
    magDiv.innerHTML = mag;
    let a = document.createElement('a');
    a.href = `${url}`;
    a.target = '_blank';
    a.style.textDecoration = 'none';
    a.style.wordBreak = 'break-all';
    let data = document.createTextNode(url);
    a.appendChild(data);
    urlDiv.appendChild(a);
    news.appendChild(dateDiv);
    news.appendChild(titleDiv);
    news.appendChild(urlDiv);
    news.appendChild(scoreDiv);
    news.appendChild(magDiv);
    subDiv.appendChild(news);
  }
  table.appendChild(subDiv);

  // 新增切換訊息顯示按鈕
  let change = document.createElement('div');
  change.id = 'changeTable';
  change.innerHTML = '展開以顯示全部';
  let checkTable = false;
  change.addEventListener('click', function () {
    if (checkTable == false) {
      change.innerHTML = '收合';
      checkTable = true;
      document.getElementById(tableId).style.display = 'block';
    } else {
      change.innerHTML = '展開以顯示全部';
      checkTable = false;
      document.getElementById(tableId).style.display = 'none';
    }
  })

  source.appendChild(mediaDiv);
  source.appendChild(change);
  source.appendChild(table);
}
