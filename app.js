var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var cna = require('./scripts/cna');
var chtimes = require('./scripts/chtimes');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

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

app.listen(3000, () => {
  console.log('The server is running on port 3000!');
});

function webCrawler(){
  schedule.scheduleJob(' * */1 * * *', function(){
      cna();
      chtimes();
  }); 
}
let chtimesAll = 'https://www.chinatimes.com/search/%E6%94%BF%E6%B2%BB?';
let chtimesPolitic = 'https://www.chinatimes.com/politic/total?';
let cnaAll = 'https://www.cna.com.tw/list/aipl.aspx';
let cnaPolitic = 'https://www.cna.com.tw/cna2018api/api/simplelist/categorycode/aipl/pageidx/';
// chtimes(chtimesAll)
cna(cnaAll);

module.exports = app;
