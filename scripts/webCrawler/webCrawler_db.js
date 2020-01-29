const mysql = require('../../util/mysqlcon');


function insertNews(media, date, title, url, score, magnitude) {
    return new Promise((resolve, reject) => {
        // 新增新聞資料
        let insertNewsSql = `INSERT INTO tbt.news SET ?`
        let insertNewsPost = {
            media: media,
            date: date,
            title: title,
            url: url,
            score: score,
            magnitude: magnitude
        };
        mysql.query(insertNewsSql, insertNewsPost, function (insertNewsErr, insertNewsResult) {
            if (insertNewsErr) {
                reject(insertNewsErr)
            }
            resolve({
                answer: true,
                newsId: insertNewsResult.insertId
            })
        })
    })
}

function insertArticle(article, url) {
    return new Promise((resolve, reject) => {
        // 新增新聞文章
        let insertArticleSql = `INSERT INTO tbt.article SET ?`
        let insertArticlePost = {
            article: article,
            news_url: url
        }
        mysql.query(insertArticleSql, insertArticlePost, function (insertArticleErr, insertArticleResult) {
            if (insertArticleErr) {
                reject(insertArticleErr)
            }
            resolve(true)
        })
    })
}

function insertKeyword(keyword, newsId) {
    let results = [];
    return new Promise((resolve, reject) => {
        // 新增關鍵字
        let insertKeywordsSql = `INSERT INTO tbt.keyword SET ?`
        let insertKeywordsPost = {
            keyword: keyword,
            news_id: newsId
        }
        mysql.query(insertKeywordsSql, insertKeywordsPost, function (insertKeywordsErr, insertKeywordsResult) {
            if (insertKeywordsErr) {
                reject(insertKeywordsErr)
            }
            results.push(true)
        })
        resolve(results)
    })
}

function getReporterId(author) {
    return new Promise((resolve, reject) => {
        let selectReporterSql = `SELECT id FROM reporter WHERE name = '${author}'`;
        mysql.query(selectReporterSql, function (selectReporterErr, selectReporterResult) {
            if (selectReporterErr) {
                reject(selectReporterErr)
            }
            if (selectReporterResult.length > 0) {
                let reporterId = selectReporterResult[0].id
                resolve(reporterId)
            } else {
                let insertReporterSql = `INSERT INTO tbt.reporter SET ?`;
                let insertReporterPost = {
                    name: author
                }
                mysql.query(insertReporterSql, insertReporterPost, function (insertReporterErr, insertReporterResult) {
                    if (insertReporterErr) {
                        reject(insertReporterErr)
                    }
                    let reporterId = insertReporterResult.insertId;
                    resolve(reporterId)
                })
            }
        })
    })
}

function insertReporterNews(reporterId, newsId) {
    return new Promise((resolve, reject) => {
        let results = []
        // 新增記者與新聞間之關係
        let insertReporterNewsSql = `INSERT INTO tbt.reporter_has_news SET ?`
        let insertReporterNewsPost = {
            reporter_id: reporterId,
            news_id: newsId
        }
        mysql.query(insertReporterNewsSql, insertReporterNewsPost, function (insertReporterNewsErr, insertReporterNewsResult) {
            if (insertReporterNewsErr) {
                reject(insertReporterNewsErr)
            }
            results.push(true)
        })
        resolve(true)
    })
}

function checkUrl(url) {
    return new Promise((resolve, reject) => {
        let sql = `SELECT id FROM tbt.news WHERE url = '${url}'`;
        mysql.query(sql, function (err, result) {
            if (err) {
                reject('error from checking url query')
                throw err
            }
            if (result) {
                resolve(result)
            }
        })
    })
}

module.exports = {
    insertNews: insertNews,
    insertArticle: insertArticle,
    insertKeyword: insertKeyword,
    getReporterId: getReporterId,
    insertReporterNews: insertReporterNews,
    checkUrl: checkUrl
};
