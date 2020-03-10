/* eslint-disable no-unused-vars */
/* eslint-disable max-len */
/* eslint-disable require-jsdoc */
// 更新斷詞字典用
const mysql = require('../util/mysqlcon');
const moment = require('moment');
const fs = require('fs');

function getKeyword() {
  return new Promise((resolve, reject) => {
    const sql = `SELECT * FROM keyword WHERE add_in_dict=?;`;
    const keywords = [];
    const id = [];
    mysql.query(sql, ['no'], function(err, result) {
      if (err) throw err;
      for (let i = 0; i < result.length; i++) {
        keywords.push(result[i].keyword);
        id.push(result[i].id);
        if (i == result.length - 1) {
          resolve({
            keywords: keywords,
            id: id,
          });
        }
      }
    });
  });
}
function getReporter() {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT name FROM reporter;';
    const reporters = [];
    mysql.query(sql, function(err, result) {
      if (err) throw err;
      for (let i = 0; i < result.length; i++) {
        reporters.push(result[i].name);
        if (i == result.length - 1) {
          resolve(reporters);
        }
      }
    });
  });
}
function getDict() {
  return new Promise((resolve, reject) => {
    fs.readFile('./scripts/similarity/dict.txt', 'utf8', function(err, data) {
      if (err) throw err;
      const kArray = data.split('\n');
      const key = {};
      for (let i = 0; i < kArray.length; i++) {
        const title = kArray[i].split(' ')[0];
        key[title] = kArray[i].split(' ');
        if (i == kArray.length - 1) {
          resolve(key);
        }
      }
    });
  });
}
async function updateDict() {
  const t = moment().format('YYYY-MM-DD-HH:mm:ss');
  try {
    // 讀進斷詞字典
    const keyInDict = await getDict();
    // 欲加進字典的詞
    const collectKeywordResult = await getKeyword();
    let keywords = collectKeywordResult.keywords;
    keywords = keywords.sort();
    const id = collectKeywordResult.id;

    // 若要將記者加進字典，請取消下兩行的註解
    // const reporters = await getReporter();
    // const eachReporter = [...new Set(reporters)].sort();
    // 處理此次各關鍵字出現的次數
    const countedKeywords = keywords.reduce(function(allKeywords, keyword) {
      if (keyword in allKeywords) {
        allKeywords[keyword]++;
      } else {
        allKeywords[keyword] = 1;
      }
      return allKeywords;
    }, {});

    // 加進字典，若已存在在字典裡就累加，若無則新增
    Object.keys(countedKeywords).forEach((el) => {
      if (Object.keys(keyInDict).indexOf(el) >= 0) {
        keyInDict[el][1] = Number(keyInDict[el][1]) + countedKeywords[el];
      } else {
        keyInDict[el] = [el, countedKeywords[el], 'N'];
      }
    });
    let newDict = '';
    Object.values(keyInDict).forEach((el) => {
      newDict += el.join(' ') + '\n';
    });

    // 將新增後的字典寫回進字典txt裡
    fs.writeFile('./scripts/similarity/dict2.txt', newDict, 'utf8', function(err) {
      if (err) {
        console.log(t, 'Error from writing dict', err);
      }
    });

    // 更新keyword table的加入字典欄
    for (let i = 0; i < id.length; i++) {
      const sql = `UPDATE keyword SET add_in_dict=? WHERE id=?;`;
      mysql.query(sql, ['yes', id[i]], function(err, result) {
        if (err) {
          console.log(t, 'Error from updating keyword', err);
        } else {
          if (i == id.length - 1) {
            console.log(t, 'Update keyword dict is done');
          }
        }
      });
    }
  } catch (e) {

  }
}

module.exports = updateDict;
