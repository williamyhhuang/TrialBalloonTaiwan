var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var schedule = require('node-schedule');

const ltn = require('./scripts/ltn');
const chtimes = require('./scripts/chtimes');
const cna = require('./scripts/cna');

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
// let webCrawlingJob = schedule.scheduleJob(' * */2 * * *',async function () {
//   await ltn.new('https://news.ltn.com.tw/list/breakingnews/politics')
//     .then(async() => {
//       await cna.new('https://www.cna.com.tw/cna2018api/api/simplelist/categorycode/aipl/pageidx/');
//     })
//     .then(async() => {
//       await chtimes.new('https://www.chinatimes.com/politic/total?');
//     })
// })

  // ltn.new('https://news.ltn.com.tw/list/breakingnews/politics')
  // ltn.all('https://news.ltn.com.tw/search?keyword=%E6%94%BF%E6%B2%BB','2019-12-01','2020-01-01');
  // cna.new('https://www.cna.com.tw/cna2018api/api/simplelist/categorycode/aipl/pageidx/');
  // cna.all('https://www.cna.com.tw/cna2018api/api/simplelist/searchkeyword/%E6%94%BF%E6%B2%BB/pageidx/');
  chtimes.new('https://www.chinatimes.com/politic/total?')
  // chtimes.all('https://www.chinatimes.com/search/%E6%94%BF%E6%B2%BB?')


module.exports = app;
