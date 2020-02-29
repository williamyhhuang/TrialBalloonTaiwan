// 所在頁面上色
color()

// 按下 enter 即搜尋
if (location.href.indexOf(location.protocol + '//' + location.host + '/' + 'news') >= 0 || location.href.indexOf(location.protocol + '//' + location.host + '/' + 'search/news') >= 0) {
  let search = document.getElementById("input");
  search.addEventListener("keypress", function (event) {
    if (event.keyCode === 13) {
      event.preventDefault();
      document.getElementById('search').click();
    }
  });
}

if (location.href.indexOf(location.protocol + '//' + location.host + '/' + 'media') >= 0 || location.href.indexOf(location.protocol + '//' + location.host + '/' + 'search/media') >= 0) {
  let search = document.getElementById("input");
  search.addEventListener("keypress", function (event) {
    if (event.keyCode === 13) {
      event.preventDefault();
      document.getElementById('search').click();
    }
  });
}

if (location.href.indexOf(location.protocol + '//' + location.host + '/' + 'reporter') >= 0 || location.href.indexOf(location.protocol + '//' + location.host + '/' + 'search/reporter') >= 0) {
  // 在記者比一比頁面預設記者
  defaultMediaCna();
  let search = document.getElementById("input");
  search.addEventListener("keypress", function (event) {
    if (event.keyCode === 13) {
      event.preventDefault();
      document.getElementById('search').click();
    }
  });
}
// 預設搜尋日期
document.getElementById('end_date').value = moment().format('YYYY-MM-DD');


/// 以下為function ///
function searchNews() {
  let input = document.getElementById('input').value;
  let start = document.getElementById('start_date').value;
  let end = document.getElementById('end_date').value;
  input = input.split(' ');
  let period = (new Date(end) - new Date(start));
  let time = new Date(period)
  let threeMonth = 7776000000;

  if (input == '' || start == '' || end == '') {
    window.alert('請填寫搜尋條件');
  } else if (period < 0) {
    window.alert('結束日期須大於開始日期');
  } else if (time > threeMonth) {
    window.alert('查詢區間須小於三個月');
  } else {
    let keyword = '';
    for (let i = 0; i < input.length; i++) {
      keyword += '+' + input[i];
    }
    keyword = keyword.slice(1);

    window.location = `${location.protocol}//${location.host}/search/news?keyword=${keyword}&start=${start}&end=${end}`;
  }
}

function searchMedia() {
  let input = document.getElementById('input').value;
  let start = document.getElementById('start_date').value;
  let end = document.getElementById('end_date').value;
  let period = (new Date(end) - new Date(start));
  let time = new Date(period)
  let sixMonth = 15552000000;

  if (input == '' || start == '' || end == '') {
    window.alert('請填寫搜尋條件');
  } else if (period < 0) {
    window.alert('結束日期須大於開始日期');
  } else if (time > sixMonth) {
    window.alert('查詢區間須小於六個月');
  } else {
    input = input.split(' ');
    let keyword = '';
    for (let i = 0; i < input.length; i++) {
      keyword += '+' + input[i];
    }
    keyword = keyword.slice(1);

    window.location = `${location.protocol}//${location.host}/search/media?keyword=${keyword}&start=${start}&end=${end}`;
  }
}

function searchReporter() {
  let input = document.getElementById('input').value;
  let media1 = document.getElementById('mediaSelect1').value;
  let media2 = document.getElementById('mediaSelect2').value;
  let reporter1 = document.getElementById('selectReporter1').value;
  let reporter2 = document.getElementById('selectReporter2').value;
  let start = document.getElementById('start_date').value;
  let end = document.getElementById('end_date').value;
  let period = (new Date(end) - new Date(start));
  let time = new Date(period)
  let sixMonth = 15552000000;

  if (input == '' || start == '' || end == '') {
    window.alert('請填寫搜尋條件');
  } else if (period < 0) {
    window.alert('結束日期須大於開始日期');
  } else if (time > sixMonth) {
    window.alert('查詢區間須小於六個月');
  } else {
    input = input.split(' ');
    let keyword = '';
    for (let i = 0; i < input.length; i++) {
      keyword += '+' + input[i];
    }
    keyword = keyword.slice(1);

    window.location = `${location.protocol}//${location.host}/search/reporter?media1=${media1}&reporter1=${reporter1}&media2=${media2}&reporter2=${reporter2}&keyword=${keyword}&start=${start}&end=${end}`;
  }
}

// 重新導向
function redirectHome() {
  window.location = `${location.protocol}//${location.host}/home`;
}

function redirectNews() {
  window.location = `${location.protocol}//${location.host}/news`;
}

function redirectMedia() {
  window.location = `${location.protocol}//${location.host}/media`;
}

function redirectReporter() {
  window.location = `${location.protocol}//${location.host}/reporter`;
}

function redirectAbout() {
  window.location = `${location.protocol}//${location.host}/about`;
}

// 選到該功能的顏色切換
function color() {
  if (location.href.indexOf('news') != -1) {
    document.getElementById('cat_news').style.color = 'black';
    document.getElementById('cat_news').style.fontWeight = 'bold';
  } else if (location.href.indexOf('reporter') != -1) {
    document.getElementById('cat_reporter').style.color = 'black';
    document.getElementById('cat_reporter').style.fontWeight = 'bold';
  } else if (location.href.indexOf('media') != -1) {
    document.getElementById('cat_media').style.color = 'black';
    document.getElementById('cat_media').style.fontWeight = 'bold';
  } else if (location.href.indexOf('about') != -1) {
    document.getElementById('cat_about').style.color = 'black';
    document.getElementById('cat_about').style.fontWeight = 'bold';
  }
}

// 切換記者比一比的報社與記者
function change(media, reporterSelect) {
  let select = document.getElementById(media);
  let opt = select.options[select.selectedIndex].value;

  fetch(`${location.protocol}//${location.host}/api/selectReporter?media=${opt}`)
    .then(function (response) {
      return response.json();
    })
    .then(function (data) {
      data = data.sort();
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

// 預設記者比一比的報社為中央社
function defaultMediaCna() {
  fetch(`${location.protocol}//${location.host}/api/selectReporter?media=cna`)
    .then(function (response) {
      return response.json();
    })
    .then(function (data) {
      data = data.sort();
      let reporter1 = document.getElementById('selectReporter1');
      let reporter2 = document.getElementById('selectReporter2');
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