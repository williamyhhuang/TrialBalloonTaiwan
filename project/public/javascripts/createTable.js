/// 新增新聞標題 ///
function createTableTitle_date(date, name) {
    date.innerHTML = name;
    date.className = 'mediaTableItem';
    date.style.borderBottomStyle = 'solid';
    date.style.width = '20%';
  }
  function createTableTitle_title(title, name) {
    title.innerHTML = name;
    title.className = 'mediaTableItem';
    title.style.width = '100%';
    title.style.borderStyle = 'solid';
    title.style.borderTopStyle = 'none';
  }
  function createTableTitle_url(url, name) {
    url.innerHTML = name;
    url.className = 'mediaTableItem';
    url.style.width = '100%';
    url.style.borderBottomStyle = 'solid';
  }
  function createTableTitle_score(score, name) {
    score.innerHTML = name;
    score.className = 'mediaTableItem';
    score.style.width = '19%';
    score.style.borderStyle = 'solid';
    score.style.borderTopStyle = 'none';
  }
  function createTableTitle_mag(mag, name) {
    mag.innerHTML = name;
    mag.className = 'mediaTableItem';
    mag.style.width = '19%';
    mag.style.borderBottomStyle = 'solid';
  }
  /// 新增新聞本身 ///
  function createTable_date(dateDiv, name) {
    dateDiv.innerHTML = name;
    dateDiv.className = 'mediaTableItem';
    dateDiv.style.width = '20%';
    dateDiv.style.padding = '2px 0px';
  }
  function createTable_title(titleDiv, name) {
    titleDiv.innerHTML = name;
    titleDiv.className = 'mediaTableItem';
    titleDiv.style.width = '100%';
    titleDiv.style.padding = '2px 0px';
    titleDiv.style.borderLeftStyle = 'solid';
    titleDiv.style.borderRightStyle = 'solid';
  }
  function createTable_url(urlDiv, url) {
    urlDiv.className = 'mediaTableItem';
    urlDiv.style.width = '100%';
    urlDiv.style.padding = '2px 0px';
    let a = document.createElement('a');
    let data = document.createTextNode(url);
    a.href = `${url}`;
    a.target = '_blank';
    a.style.textDecoration = 'none';
    a.style.wordBreak = 'break-all';
    a.appendChild(data);
    urlDiv.appendChild(a);
  }
  function createTable_score(scoreDiv, score) {
    scoreDiv.innerHTML = score;
    scoreDiv.className = 'mediaTableItem';
    scoreDiv.style.width = '19%';
    scoreDiv.style.padding = '2px 0px';
    scoreDiv.style.borderLeftStyle = 'solid';
    scoreDiv.style.borderRightStyle = 'solid';
  }
  function createTable_mag(magDiv, mag) {
    magDiv.className = 'mediaTableItem';
    magDiv.innerHTML = mag;
    magDiv.style.width = '19%';
    magDiv.style.padding = '2px 0px';
  }
  // 將個元素加進 div 
  function append(div, ...theArgs) {
    theArgs.forEach(el => {
      div.appendChild(el)
    })
  }
  // 展開按鈕
  function spreadBtn(change, tableId){
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
  }
  // 置頂按鈕
  function goTopBtn(goTop){
    goTop.id = 'goTop';
    let a = document.createElement('a');
    a.href = `#source`;
    a.innerHTML = 'Go Top';
    goTop.appendChild(a)
  }