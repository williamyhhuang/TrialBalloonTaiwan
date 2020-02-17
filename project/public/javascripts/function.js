function searchNews() {
  let input = document.getElementById('input').value;
  let start = document.getElementById('start_date').value;
  let end = document.getElementById('end_date').value;
  input = input.split(' ');
  let period = (new Date(end) - new Date(start));
  let time = new Date(period)
  let sixMonth = 15552000000;

  if (period < 0) {
    window.alert('結束日期須大於開始日期');
  } else if (time > sixMonth) {
    window.alert('搜尋日期須小於六個月');
  } else {
    let keyword = '';
    for (let i = 0; i < input.length; i++) {
      keyword += '+' + input[i];
    }
    keyword = keyword.slice(1);
    const host = location.host;
    window.location = `http://${host}/search/news?keyword=${keyword}&start=${start}&end=${end}`;
  }
}

function searchMedia() {
  let input = document.getElementById('input').value;
  let start = document.getElementById('start_date').value;
  let end = document.getElementById('end_date').value;
  let period = (new Date(end) - new Date(start));
  let time = new Date(period)
  let sixMonth = 15552000000;

  if (period < 0) {
    window.alert('結束日期須大於開始日期');
  } else if (time > sixMonth) {
    window.alert('搜尋日期須小於六個月');
  } else {
    input = input.split(' ');
    let keyword = '';
    for (let i = 0; i < input.length; i++) {
      keyword += '+' + input[i];
    }
    keyword = keyword.slice(1);

    const host = location.host;
    window.location = `http://${host}/search/media?keyword=${keyword}&start=${start}&end=${end}`;
  }
}

function searchReporter() {
  let input = document.getElementById('input').value;
  let media1 = document.getElementById('mediaSelect1').value;
  let media2 = document.getElementById('mediaSelect2').value;
  let reporter1 = document.getElementById('reporterSelect1').value;
  let reporter2 = document.getElementById('reporterSelect2').value;
  let start = document.getElementById('start_date').value;
  let end = document.getElementById('end_date').value;
  let period = (new Date(end) - new Date(start));
  let time = new Date(period)
  let sixMonth = 15552000000;

  if (period < 0) {
    window.alert('結束日期須大於開始日期');
  } else if (time > sixMonth) {
    window.alert('搜尋日期須小於六個月');
  } else {
    input = input.split(' ');
    let keyword = '';
    for (let i = 0; i < input.length; i++) {
      keyword += '+' + input[i];
    }
    keyword = keyword.slice(1);


    const host = location.host;
    window.location = `http://${host}/search/reporter?media1=${media1}&reporter1=${reporter1}&media2=${media2}&reporter2=${reporter2}&keyword=${keyword}&start=${start}&end=${end}`;
  }
}

function redirectNews() {
  const host = location.host;
  window.location = `http://${host}/news`;
}

function redirectMedia() {
  const host = location.host;
  window.location = `http://${host}/media`;
}

function redirectReporter() {
  const host = location.host;
  window.location = `http://${host}/reporter`;
}

function color() {
  let href = location.href;
  if (href.indexOf('news') != -1 || href == 'http://localhost:3000/') {
    document.getElementById('cat_news').style.backgroundColor = '#f2d24d';
    document.getElementById('cat_news').style.color = 'white';
  } else if (href.indexOf('reporter') != -1) {
    document.getElementById('cat_reporter').style.backgroundColor = '#f2d24d';
    document.getElementById('cat_reporter').style.color = 'white';
  } else if (href.indexOf('media') != -1) {
    document.getElementById('cat_media').style.backgroundColor = '#f2d24d';
    document.getElementById('cat_media').style.color = 'white';
  }
}

color()

function change(media, reporterSelect) {
  let select = document.getElementById(media);
  let opt = select.options[select.selectedIndex].value;
  let host = location.host;
  fetch(`http://${host}/api/selectReporter?media=${opt}`)
    .then(function (response) {
      return response.json();
    })
    .then(function (data) {
      let reporter = document.getElementById(reporterSelect);
      while (reporter.firstChild) {
        reporter.removeChild(reporter.firstChild);
      }
      for (let i = 0; i < data.length; i++) {
        let option = document.createElement('option');
        option.text = data[i];
        option.value = data[i];
        reporter.appendChild(option);
      }
    })
}

function defaultCna(){
  let host = location.host;
  fetch(`http://${host}/api/selectReporter?media=cna`)
    .then(function (response) {
      return response.json();
    })
    .then(function (data) {
      let reporter1 = document.getElementById('reporterSelect1');
      let reporter2 = document.getElementById('reporterSelect2');
      while (reporter1.firstChild) {
        reporter1.removeChild(reporter1.firstChild);
      }
      while (reporter2.firstChild) {
        reporter2.removeChild(reporter2.firstChild);
      }
      for (let i = 0; i < data.length; i++) {
        let option1 = document.createElement('option');
        option1.text = data[i];
        option1.value = data[i];
        reporter1.appendChild(option1);
        let option2 = document.createElement('option');
        option2.text = data[i];
        option2.value = data[i];
        reporter2.appendChild(option2);
      }
    })
}

defaultCna();