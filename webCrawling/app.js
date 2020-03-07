var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var CronJob = require('cron').CronJob;
var moment = require('moment');
const ltn = require('./scripts/ltn');
const chtimes = require('./scripts/chtimes');
const cna = require('./scripts/cna');
const updateDict = require('./scripts/updateDict');
const updateTokenize = require('./scripts/updateTokenize');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

app.listen(5000, () => {
  console.log('The webCrawling is running on port 5000!');
});

// 各報社爬蟲，每兩小時爬一次
let webCrawlingJob = new CronJob('0 0 */2 * * *', async function () {

  try {
    cna.new('https://www.cna.com.tw/cna2018api/api/simplelist/categorycode/aipl/pageidx/')
    .then(async () => {
      let t = moment().format('YYYY-MM-DD-HH:mm:ss');
      console.log(t, 'cna new webCrawling is done');
      return ltn.new('https://news.ltn.com.tw/list/breakingnews/politics')
    })
    .then(async () => {
      let t = moment().format('YYYY-MM-DD-HH:mm:ss');
      console.log(t, 'ltn new webCrawling is done');
      return chtimes.new('https://www.chinatimes.com/politic/total?');
    })
    .then(async () => {
      let t = moment().format('YYYY-MM-DD-HH:mm:ss');
      console.log(t, 'chtimes new webCrawling is done');
      console.log(t, 'all webcrawling new is done');
    })
  } catch (e) {
    console.log(e)
  }
})

// 更新斷詞字典及及資料庫的斷詞欄位(article.tokenize)
let updateDictJob = new CronJob('0 0 3 * * 1', async function () {
  try {
    await updateDict()
      .then(async () => {
        return updateTokenize();
      })
      .then(async() => {
        let t = moment().format('YYYY-MM-DD-HH:mm:ss');
        return console.log(t, 'updating dict and tokenize is done');
      })
  } catch (e) {
    console.log(e);
  }
})

webCrawlingJob.start();
updateDictJob.start();

// 若要爬過去的新聞，可以執行以下程式

// ltn.all('https://news.ltn.com.tw/search?keyword=%E6%94%BF%E6%B2%BB','2019-12-01','2020-02-14');
// cna.all('https://www.cna.com.tw/cna2018api/api/simplelist/searchkeyword/%E6%94%BF%E6%B2%BB/pageidx/');
// chtimes.all('https://www.chinatimes.com/search/%E6%94%BF%E6%B2%BB?')


module.exports = app;
