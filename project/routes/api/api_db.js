const mysql = require('../../util/mysqlcon');

// 新聞比一比撈新聞
function getNews_news(media, input, start, end) {
    return new Promise((resolve, reject) => {
        let mediaName;
        let sql = `SELECT n.*, a.tokenize FROM tbt.news AS n INNER JOIN tbt.article AS a ON n.media = ? AND a.news_url=n.url`;
        for (let i = 0; i < input.length; i++) {
            sql += ` AND a.article LIKE ?`
        }
        sql += ` AND TO_DAYS(n.date)>= TO_DAYS(?) AND TO_DAYS(n.date) < TO_DAYS(?)`;

        let set = [];
        set[0] = media;
        for (let i = 0; i < input.length; i++) {
            let keyword = '%' + input[i] + '%'
            set.push(keyword);
        }
        set.push(start);
        set.push(end);

        switch (media) {
            case 'cna':
                mediaName = '中央社';
                break;
            case 'chtimes':
                mediaName = '中時電子報';
                break;
            case 'ltn':
                mediaName = '自由電子報';
        }

        mysql.query(sql, set, function (err, result) {
            if (err) throw err;
            if (result.length == 0) {
                resolve(false);
            } else {
                let data = [];
                for (let i = 0; i < result.length; i++) {
                    let reporterSql = `SELECT r.name FROM reporter AS r, reporter_has_news AS rn WHERE rn.news_id=? AND r.id = rn.reporter_id`;
                    mysql.query(reporterSql, [result[i].id], function (err, reporter) {
                        if (err) throw err;

                        let name = [];
                        for (let j = 0; j < reporter.length; j++) {
                            name.push(reporter[j].name);
                        }
                        let date = result[i].date;
                        date = date.replace(/\//g, '-');

                        data.push({
                            media: mediaName,
                            date: date,
                            reporter: name.join(' '),
                            title: result[i].title,
                            tokenize: result[i].tokenize,
                            url: result[i].url,
                            score: result[i].score,
                            magnitude: result[i].magnitude
                        })
                        if (i == result.length - 1) {
                            resolve(data);
                        }
                    })
                }
            }
        })
    })
}
// 報社比一比撈新聞
function getNews_media(media, input, start, end) {
    return new Promise((resolve, reject) => {
        let mediaName;
        let sql = `SELECT n.* FROM tbt.news AS n INNER JOIN tbt.article AS a ON n.media = ? AND a.news_url=n.url`;
        for (let i = 0; i < input.length; i++) {
            sql += ` AND a.article LIKE ?`
        }
        sql += ` AND TO_DAYS(n.date)>= TO_DAYS(?) AND TO_DAYS(n.date) <= TO_DAYS(?) ORDER by n.date`;

        let set = [];
        set[0] = media;
        for (let i = 0; i < input.length; i++) {
            let keyword = '%' + input[i] + '%'
            set.push(keyword);
        }
        set.push(start);
        set.push(end);

        switch (media) {
            case 'cna':
                mediaName = '中央社';
                break;
            case 'chtimes':
                mediaName = '中時電子報';
                break;
            case 'ltn':
                mediaName = '自由電子報';
        }

        mysql.query(sql, set, function (err, result) {
            if (err) throw err;
            if (result.length == 0) {
                resolve(false);
            } else {
                let data = [];
                for (let i = 0; i < result.length; i++) {
                    let date = result[i].date;
                    date = date.replace(/-/g, '/');

                    data.push({
                        media: mediaName,
                        date: date,
                        title: result[i].title,
                        url: result[i].url,
                        score: result[i].score,
                        magnitude: result[i].magnitude
                    })
                    if (i == result.length - 1) {
                        resolve(data);
                    }
                }
            }
        })
    })
}
// 記者比一比撈新聞
function getNews_reporter(media, input, start, end, name) {
    return new Promise((resolve, reject) => {
        let mediaName;
        let sql = `SELECT n.* FROM tbt.news AS n INNER JOIN tbt.reporter_has_news AS rn  ON n.id = rn.news_id INNER JOIN tbt.reporter AS r ON rn.reporter_id = r.id AND r.name=? INNER JOIN tbt.article AS a ON n.url = a.news_url `;
        for (let i = 0; i < input.length; i++) {
            sql += ` AND a.article LIKE ?`
        }
        sql += ` AND TO_DAYS(n.date)>= TO_DAYS(?) AND TO_DAYS(n.date) <= TO_DAYS(?) ORDER by n.date`;

        let set = [];
        set[0] = name;
        for (let i = 0; i < input.length; i++) {
            let keyword = '%' + input[i] + '%'
            set.push(keyword);
        }
        set.push(start);
        set.push(end);

        switch (media) {
            case 'cna':
                mediaName = '中央社';
                break;
            case 'chtimes':
                mediaName = '中時電子報';
                break;
            case 'ltn':
                mediaName = '自由電子報';
        }

        mysql.query(sql, set, function (err, result) {

            if (err) throw err;
            if (result.length == 0) {
                resolve(false);
            } else {
                let data = [];
                for (let i = 0; i < result.length; i++) {
                    let date = result[i].date;
                    date = date.replace(/-/g, '/');

                    data.push({
                        media: mediaName,
                        date: date,
                        title: result[i].title,
                        url: result[i].url,
                        score: result[i].score,
                        magnitude: result[i].magnitude
                    })
                    if (i == result.length - 1) {
                        resolve(data);
                    }
                }
            }
        })
    })
}
// 撈所有報社記者的名字
function getReporterName() {
    return new Promise((resolve, reject) => {
        let sql = `SELECT * FROM reporter`;
        mysql.query(sql, function (err, result) {
            if (err) {
                reject(err);
            }
            let cna = [];
            let chtimes = [];
            let ltn = [];

            for (let i = 0; i < result.length; i++) {
                if (result[i].media == 'cna') {
                    cna.push(result[i].name)
                } else if (result[i].media == 'chtimes') {
                    chtimes.push(result[i].name)
                } else if (result[i].media == 'ltn') {
                    ltn.push(result[i].name)
                }
            }
            resolve({
                cna: cna,
                chtimes: chtimes,
                ltn: ltn
            })
        })
    })
}
module.exports = {
    getNews_news: getNews_news,
    getNews_media: getNews_media,
    getNews_reporter: getNews_reporter,
    getReporterName: getReporterName
}