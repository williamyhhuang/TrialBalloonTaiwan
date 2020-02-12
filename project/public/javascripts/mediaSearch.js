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
    console.log(data);
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

      let month = Object.keys(data.result.cna);
      let cna = mediaData(data.result.cna);
      let chtimes = mediaData(data.result.chtimes);
      let ltn = mediaData(data.result.ltn);

      // 圖表div建立
      let container = document.createElement('div');
      container.className = 'chart-container';
      container.style.display = 'flex';
      // let chart = document.createElement('canvas');
      // chart.id = 'chart';
      // container.appendChild(chart);
      // document.body.appendChild(container);
      // let myChart = createChart(chart, month, cna, chtimes, ltn);
      let scoreDiv = document.createElement('div');
      let magDiv = document.createElement('div');
      let chartScore = document.createElement('canvas');
      let chartMag = document.createElement('canvas');
      scoreDiv.className='scoreDiv';
      magDiv.className='magDiv';
      chartScore.className = 'chart';
      chartMag.className = 'chart';
      scoreDiv.appendChild(chartScore);
      magDiv.appendChild(chartMag);
      container.appendChild(scoreDiv);
      container.appendChild(magDiv);
      document.body.appendChild(container);
      let myScoreChart = createScoreChart(chartScore, month, cna, chtimes, ltn);
      let myMagChart = createMagChart(chartMag, month, cna, chtimes, ltn);
      // 參數說明
      let instance = document.createElement('div');
      instance.id = 'instance';
      instance.innerHTML = '<h2>分析值說明 : </h2><ul><li>Score : 範圍介於 -1.0 (負面) 和 1.0 (正面) 之間，可反映文字的整體情緒傾向。</li><li>Magnitude : 表示文字的整體情緒強度，介於 0.0 和 +inf 之間。只要文字內容出現情緒用字都會提高文字的 magnitude 值。</li><li>詳細說明請參考<a href="https://cloud.google.com/natural-language/docs/basics?hl=zh-tw"> GOOGLE - NLP</a></li></ul>';
      document.body.appendChild(instance);
    }
  })


function createTable(media, mediaValue, table) {
  for (let i = 0; i < media.length; i++) {
    let div = document.createElement('div');
    div.className = media[i];
    for (let j = 0; j < mediaValue[i].length; j++) {
      if (j == 4 && mediaValue[i][j] != '新聞連結') {
        let subDiv = document.createElement('div');
        subDiv.className = 'item';
        let a = document.createElement('a');
        a.href = `${mediaValue[i][j]}`;
        a.target = '_blank';
        a.style.textDecoration = 'none';
        a.style.wordBreak = 'break-all';
        let data = document.createTextNode(mediaValue[i][j]);
        a.appendChild(data);
        subDiv.appendChild(a);
        div.appendChild(subDiv);
      } else {
        let subDiv = document.createElement('div');
        subDiv.className = 'item';
        let text = document.createTextNode(mediaValue[i][j]);
        subDiv.appendChild(text);
        div.appendChild(subDiv);
      }
    }
    table.appendChild(div)
  }
}

function changeTable(media, mediaValue, table) {
  for (let i = 0; i < media.length; i++) {
    let elements = document.getElementsByClassName(media[i]);
    while (elements.length > 0) {
      elements[0].parentNode.removeChild(elements[0]);
    }

    let div = document.createElement('div');
    div.className = media[i];
    for (let j = 0; j < mediaValue[i].length; j++) {
      if (j == 4 && mediaValue[i][j] != '新聞連結') {
        let subDiv = document.createElement('div');
        subDiv.className = 'item';
        let a = document.createElement('a');
        a.href = `${mediaValue[i][j]}`;
        a.target = '_blank';
        a.style.textDecoration = 'none';
        a.style.wordBreak = 'break-all';
        let data = document.createTextNode(mediaValue[i][j]);
        a.appendChild(data);
        subDiv.appendChild(a);
        div.appendChild(subDiv);
      } else {
        let subDiv = document.createElement('div');
        subDiv.className = 'item';
        let text = document.createTextNode(mediaValue[i][j]);
        subDiv.appendChild(text);
        div.appendChild(subDiv);
      }
    }
    table.appendChild(div)
  }
}

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

function createChart(chart, month, cna, chtimes, ltn) {
  let cnaData = collect(cna);
  let chtimesData = collect(chtimes);
  let ltnData = collect(ltn);
  return new Chart(chart, {
    type: 'bar',
    data: {
      labels: month,
      datasets: [{
        type: 'line',
        label: '中央通訊社 - Score',
        yAxisID: 'Score',
        data: cnaData.score,
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
        label: '中央通訊社 - Magnitude',
        yAxisID: 'Magnitude',
        data: cnaData.magnitude,
        pointBackgroundColor: 'rgba(255, 159, 64, 1)',
        pointRadius: 5,
        borderColor: 'rgba(255, 159, 64, 1)',
        fill: false,
      }, {
        type: 'line',
        label: '中時電子報 - Score',
        yAxisID: 'Magnitude',
        data: chtimesData.score,
        pointBackgroundColor: 'rgba(255, 255, 255, 1)',
        pointBorderColor: 'rgba(25, 159, 64, 1)',
        pointBorderWidth: 2,
        pointRadius: 7,
        pointStyle: 'circle',
        borderColor: 'rgba(25, 159, 64, 1)',
        borderDash: [5, 5],
        fill: false,
      }, {
        type: 'line',
        label: '中時電子報 - Magnitude',
        yAxisID: 'Magnitude',
        data: chtimesData.magnitude,
        pointBackgroundColor: 'rgba(25, 159, 64, 1)',
        pointRadius: 5,
        borderColor: 'rgba(25, 159, 64, 1)',
        fill: false,
      }, {
        type: 'line',
        label: '自由電子報 - Score',
        yAxisID: 'Magnitude',
        data: ltnData.score,
        pointBackgroundColor: 'rgba(255, 255, 255, 1)',
        pointBorderColor: 'rgba(255, 15, 64, 1)',
        pointBorderWidth: 2,
        pointRadius: 7,
        pointStyle: 'circle',
        borderColor: 'rgba(255, 15, 64, 1)',
        borderDash: [5, 5],
        fill: false,
      }, {
        type: 'line',
        label: '自由電子報 - Magnitude',
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
        text: '報社之時間與新聞情緒分析關係圖',
        fontSize: 20,
        fontStyle: 'bold',
    },
      scales: {
        xAxes: [{
          scaleLabel: {
            display: true,
            labelString: 'Month',
            // fontStyle: 'bold',
            fontSize: 20
          }
        }],
        yAxes: [{
          id: 'Score',
          type: 'linear',
          position: 'left',
          ticks: {
            max: 1,
            min: -1
          },
          scaleLabel: {
            display: true,
            labelString: 'Score',
            fontSize: 20
          }
        }, {
          id: 'Magnitude',
          type: 'linear',
          position: 'right',
          ticks: {
            beginAtZero: true,
            stepSize: 2.4,
            max: 12,
            min: -12
          },
          scaleLabel: {
            display: true,
            labelString: 'Magnitude',
            fontSize: 20
          }
        }]
      }
    }
  });
}

function changeChart(chart, data) {
  chart.data.datasets[0].data = [Number(data.chtimes.score).toFixed(2), Number(data.cna.score).toFixed, Number(data.ltn.score).toFixed(2)];
  chart.data.datasets[1].data = [Number(data.chtimes.magnitude).toFixed(2), Number(data.cna.magnitude).toFixed(2), Number(data.ltn.magnitude).toFixed(2)];
  chart.update()
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
    let score = (newsData[i].totalScore) / ((newsData[i].news).length);
    let magnitude = (newsData[i].totalMag) / ((newsData[i].news).length);
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
        label: '中時電子報',
        yAxisID: 'Score',
        data: chtimesData.score,
        pointBackgroundColor: 'rgba(255, 255, 255, 1)',
        pointBorderColor: 'rgba(25, 159, 64, 1)',
        pointBorderWidth: 2,
        pointRadius: 7,
        pointStyle: 'circle',
        borderColor: 'rgba(25, 159, 64, 1)',
        borderDash: [5, 5],
        fill: false,
      }, {
        type: 'line',
        label: '自由電子報',
        yAxisID: 'Score',
        data: ltnData.score,
        pointBackgroundColor: 'rgba(255, 255, 255, 1)',
        pointBorderColor: 'rgba(255, 15, 64, 1)',
        pointBorderWidth: 2,
        pointRadius: 7,
        pointStyle: 'circle',
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
          scaleLabel: {
            display: true,
            labelString: '月份',
            // fontStyle: 'bold',
            fontSize: 20
          }
        }],
        yAxes: [{
          id: 'Score',
          type: 'linear',
          position: 'left',
          ticks: {
            max: 1,
            min: -1
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
      datasets: [ {
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
          scaleLabel: {
            display: true,
            labelString: '月份',
            // fontStyle: 'bold',
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