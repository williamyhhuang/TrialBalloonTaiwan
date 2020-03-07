let index = [];
let url = new URLSearchParams(location.href);
for (let [key, value] of url.entries()) {
  index.push(value)
}

let keyword = index[0];
let start = index[1];
let end = index[2];
let period = (new Date(end) - new Date(start));
let threeMonth = 7776000000;
let time = new Date(period)

if (period < 0) {
  window.alert('結束日期須大於開始日期');
  window.location = `${location.protocol}//${location.host}/news`;
} else if (time > threeMonth) {
  window.alert('查詢區間須小於三個月');
  window.location = `${location.protocol}//${location.host}/news`;
} else if (moment(start).isValid() == false || moment(end).isValid() == false) {
  window.alert('日期格式錯誤');
  window.location = `${location.protocol}//${location.host}/news`;
}

fetch(`${location.protocol}//${location.host}/api/news?keyword=${keyword}&start=${start}&end=${end}`)
  .then(function (response) {
    return response.json();
  })
  .then(function (data) {
    window.onload = loading(data);

    let content = document.getElementById('content');
    let hr = document.getElementById('hr');
    hr.innerHTML = '<hr>';
    let key = document.createElement('div');
    key.id = 'keyword';
    key.innerHTML = '<p>' + '關鍵字搜尋：' + data.keyword + '</p>';
    let start = document.createElement('div');
    start.id = 'start';
    start.innerHTML = '<p>' + '搜尋日期：' + data.start + ' ~ ' + data.end + '</p>';

    content.appendChild(key);
    content.appendChild(start);

    if (data.result == false) {
      let error = document.createElement('div');
      error.id = 'error'
      error.innerHTML = '<h2>' + '沒有關於該關鍵字的新聞' + '<h2>' + '<h2>' + '請更改關鍵字或稍後再搜尋' + '<h2>';
      content.style.height = 'calc(100vh - 28px  - 78px - 148px)';
      content.appendChild(error);

    } else {
      let mainDiv = document.createElement('div');
      mainDiv.id = 'newsMainDiv';
      let leftDiv = document.createElement('div');
      leftDiv.id = 'newsLeftDiv';
      let rightDiv = document.createElement('div');
      rightDiv.id = 'newsRightDiv';
      // 圖表div建立
      let container = document.createElement('div');
      container.className = 'chart-container';
      let scoreChartDiv = document.createElement('div');
      let magChartDiv = document.createElement('div');
      scoreChartDiv.style.position = 'relative';
      magChartDiv.style.position = 'relative';

      // 建立提示
      let scoreMark = document.createElement('div');
      hintStyle(scoreMark, 'qMark', '?', '5px', '5px');
      let scoreHint = document.createElement('div');
      let scoreText = '<p style="margin: 5px;">Score : 範圍介於 -1.0 和 1.0 之間，可反映文字的整體情緒傾向。</p>'
      hintStyle(scoreHint, 'hint', scoreText, '15px', '15px');
      let magMark = document.createElement('div');
      hintStyle(magMark, 'qMark', '?', '5px', '10px');
      let magHint = document.createElement('div');
      let magText = '<p style="margin: 5px;">Magnitude : 範圍介於 0.0 和 +inf 之間，表示文字的整體情緒強度。</p>';
      hintStyle(magHint, 'hint', magText, '15px', '20px');
      let scoreChart = document.createElement('canvas');
      let magChart = document.createElement('canvas');
      scoreChart.className = 'chart';
      magChart.className = 'chart';
      append(scoreChartDiv, scoreChart, scoreMark, scoreHint);
      append(magChartDiv, magChart, magMark, magHint);

      container.appendChild(scoreChartDiv);
      container.appendChild(magChartDiv);

      let myScoreChart = createScoreChart(scoreChart, data.result[0]);
      let myMagChart = createMagChart(magChart, data.result[0]);
      leftDiv.appendChild(container);
      // 參數說明
      let instance = document.createElement('div');
      instance.id = 'instance';
      instance.innerHTML = '<h2>分析值說明 : </h2><ul><li>Score : 範圍介於 -1.0 (負面) 和 1.0 (正面) 之間，可反映文字的整體情緒傾向。</li><li>Magnitude : 表示文字的整體情緒強度，介於 0.0 和 +inf 之間。只要文字內容出現情緒用字都會提高文字的 magnitude 值。</li><li>詳細說明請參考<a href="https://cloud.google.com/natural-language/docs/basics?hl=zh-tw"> GOOGLE - NLP</a></li></ul>';
      leftDiv.appendChild(instance);
      
      // 表格div建立
      let newsTitle = document.createElement('div');
      newsTitle.id = 'newsTitle';
      newsTitle.innerHTML = '<h2>新聞來源 : </h2>';
      rightDiv.appendChild(newsTitle);
      let name = ['報社', '時間', '記者', '標題', '新聞連結', '情緒分析 Score', '情緒分析 Magnitude'];
      let chtimes = Object.values(data.result[0].chtimes);
      let cna = Object.values(data.result[0].cna);
      let ltn = Object.values(data.result[0].ltn);
      let table = document.createElement('div');
      table.className = 'newsTable';
      createTable(['cat', 'chtimes', 'cna', 'ltn'], [name, chtimes, cna, ltn], table);
      rightDiv.appendChild(table);

      // 推薦新聞
      let recommendTitle = document.createElement('div');
      recommendTitle.id = 'recommendTitle';
      recommendTitle.innerHTML = '<h2>中央社相關推薦新聞 : </h2>'
      let recommend = document.createElement('div');
      recommend.className = 'recommend';
      for (let i = 0; i < data.result.length; i++) {
        let chtimes = Object.values(data.result[i].chtimes);
        let cna = Object.values(data.result[i].cna);
        let ltn = Object.values(data.result[i].ltn);
        let subDiv = document.createElement('div');
        subDiv.className = 'item';
        subDiv.style.cursor = 'pointer';
        let text = document.createTextNode(data.result[i].cna.title);
        subDiv.appendChild(text);
        subDiv.addEventListener('click', function () {
          changeScoreChart(myScoreChart, data.result[i]);
          changeMagChart(myMagChart, data.result[i]);
          changeTable(['chtimes', 'cna', 'ltn'], [chtimes, cna, ltn], table);
        });
        recommend.appendChild(subDiv);
      }
      rightDiv.appendChild(recommendTitle);
      rightDiv.appendChild(recommend);
      mainDiv.appendChild(leftDiv);
      mainDiv.appendChild(rightDiv);
      content.appendChild(mainDiv);

    }
  })

////// 以下為 function //////

// 問號提示的style
function hintStyle(div, className, innerHTML, styleRight, styleTop) {
  div.className = className;
  div.innerHTML = innerHTML;
  div.style.right = styleRight;
  div.style.top = styleTop;
}
// 載入動畫 
function loading(data) {
  if (data != undefined) {
    document.getElementById('loader_div').style.display = 'none';
  }
}
// 新增新聞表
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
// 創建圖表
function createScoreChart(chart, data) {
  return new Chart(chart, {
    type: 'bar',
    data: {
      labels: ['中時電子報', '中央社', '自由電子報'],
      datasets: [{
        label: 'Score',
        yAxisID: 'Score',
        data: [Number(data.chtimes.score).toFixed(2), Number(data.cna.score).toFixed(2), Number(data.ltn.score).toFixed(2)],
        backgroundColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(255, 99, 132, 1)',
        ]
      }]
    },
    options: {
      title: {
        display: true,
        text: '報社與情緒傾向關係圖',
        fontSize: 18,
        fontStyle: 'bold',
        // fontColor: 'black',
        padding: 0
      },
      scales: {
        xAxes: [{
          ticks: {
            fontSize: 16
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
            // fontStyle: 'bold',
            fontSize: 16
          }
        }]
      }
    }
  });
}
function createMagChart(chart, data) {
  return new Chart(chart, {
    type: 'bar',
    data: {
      labels: ['中時電子報', '中央社', '自由電子報'],
      datasets: [{
        label: 'Magnitude',
        yAxisID: 'Magnitude',
        data: [Number(data.chtimes.magnitude).toFixed(2), Number(data.cna.magnitude).toFixed(2), Number(data.ltn.magnitude).toFixed(2)],
        backgroundColor: [
          'rgba(255, 159, 64, 1)',
          'rgba(255, 159, 64, 1)',
          'rgba(255, 159, 64, 1)',
        ]
      }]
    },
    options: {
      title: {
        display: true,
        text: '報社與情緒強度關係圖',
        fontSize: 18,
        fontStyle: 'bold',
        // fontColor: 'black'
      },
      scales: {
        xAxes: [{
          ticks: {
            fontSize: 16
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
            // fontStyle: 'bold',
            fontSize: 16,
          }
        }]
      }
    }
  });
}
// 切換圖表
function changeScoreChart(chart, data) {
  chart.data.datasets[0].data = [Number(data.chtimes.score).toFixed(2), Number(data.cna.score).toFixed(2), Number(data.ltn.score).toFixed(2)];
  chart.update()
}
function changeMagChart(chart, data) {
  chart.data.datasets[0].data = [Number(data.chtimes.magnitude).toFixed(2), Number(data.cna.magnitude).toFixed(2), Number(data.ltn.magnitude).toFixed(2)];
  chart.update()
}