const mysql = require('../util/mysqlcon');
const fs = require('fs');

function getKeyword() {
  return new Promise((resolve, reject) => {
    let sql = `SELECT * FROM keyword WHERE add_in_dict='no';`;
    let keywords = [];
    let id = [];
    mysql.query(sql, function (err, result) {
      if (err) throw err;
      for (let i = 0; i < result.length; i++) {
        keywords.push(result[i].keyword);
        id.push(result[i].id);
        if (i == result.length - 1) {
          resolve({
            keywords: keywords,
            id: id
          });
        }
      }
    })
  })
}
function getReporter() {
  return new Promise((resolve, reject) => {
    let sql = 'SELECT name FROM reporter;';
    let reporters = [];
    mysql.query(sql, function (err, result) {
      if (err) throw err;
      for (let i = 0; i < result.length; i++) {
        reporters.push(result[i].name);
        if (i == result.length - 1) {
          resolve(reporters);
        }
      }
    })
  })
}
function getDict() {
  return new Promise((resolve, reject) => {
    fs.readFile('./scripts/similarity/dict.txt', 'utf8', function (err, data) {
      if (err) throw err;
      let kArray = data.split('\n')
      let k = [];
      let key = {};
      for (let i = 0; i < kArray.length; i++) {
        // let key = kArray[i].split(' ')[0];
        let title = kArray[i].split(' ')[0];
        key[title] = kArray[i].split(' ');
        // k.push(key);
        if (i == kArray.length - 1) {
          resolve(key);
        }
      }
    })
  })
}
async function updateDict() {
  try {
    // 讀進斷詞字典
    let keyInDict = await getDict();
    // 欲加進字典的詞
    let collectKeywordResult = await getKeyword();
    let keywords = collectKeywordResult.keywords;
    keywords = keywords.sort();
    let id = collectKeywordResult.id;

    let reporters = await getReporter();
    let eachReporter = [...new Set(reporters)].sort();
    // 處理此次各關鍵字出現的次數
    let countedKeywords = keywords.reduce(function (allKeywords, keyword) {
      if (keyword in allKeywords) {
        allKeywords[keyword]++;
      }
      else {
        allKeywords[keyword] = 1;
      }
      return allKeywords;
    }, {});

    // 加進字典，若已存在在字典裡就累加，若無則新增
    Object.keys(countedKeywords).forEach(el => {
      if (Object.keys(keyInDict).indexOf(el) >= 0) {
        keyInDict[el][1] = Number(keyInDict[el][1]) + countedKeywords[el];
      } else {
        keyInDict[el] = [el, countedKeywords[el], 'N'];
      }
    })
    let newDict = '';
    Object.values(keyInDict).forEach(el => {
      newDict += el.join(' ') + '\n';
    })

    // 將新增後的字典寫回進字典txt裡
    fs.writeFile('./scripts/similarity/dict2.txt', newDict, 'utf8', function (err) {
      if (err) {
        console.log(err)
      }
    })

    // 更新keyword table的加入字典欄
    for (let i = 0; i < id.length; i++) {
      let sql = `UPDATE keyword SET add_in_dict='yes' WHERE id=${id[i]};`;
      mysql.query(sql, function (err, result) {
        if (err) {
          console.log(err)
        } else {
          if (i == id.length - 1) {
            console.log('update keyword dict is done');
          }
        }
      })
    }

  } catch (e) {

  }
}

// updateDict()
module.exports = updateDict;

