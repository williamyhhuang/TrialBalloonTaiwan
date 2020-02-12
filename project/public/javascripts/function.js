function searchNews() {
  let input = document.getElementById('input').value;
  let start = document.getElementById('start_date').value;
  let end = document.getElementById('end_date').value;
  input = input.split(' ');

  if (end < start) {
    window.alert('結束日期須大於開始日期');
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

  if (end < start) {
    window.alert('結束日期須大於開始日期');
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
  let media1 = document.getElementById('media1').value;
  let media2 = document.getElementById('media2').value;
  let reporter1 = document.getElementById('reporter1').value;
  let reporter2 = document.getElementById('reporter2').value;
  let start = document.getElementById('start_date').value;
  let end = document.getElementById('end_date').value;

  if (end < start) {
    window.alert('結束日期須大於開始日期');
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