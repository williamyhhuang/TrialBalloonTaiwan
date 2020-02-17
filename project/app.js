var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var newsRouter = require('./routes/news')
var mediaRouter = require('./routes/media')
var reporterRouter = require('./routes/reporter')
var newsSearchRouter = require('./routes/newsSearch')
var mediaSearchRouter = require('./routes/mediaSearch')
var reporterSearchRouter = require('./routes/reporterSearch')
var newsApiRouter = require('./routes/api/newsApi')
var mediaApiRouter = require('./routes/api/mediaApi')
var reporterApiRouter = require('./routes/api/reporterApi');
var selectReporterApiRouter = require('./routes/api/selectReporter');

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
app.use('/news', newsRouter);
app.use('/media', mediaRouter);
app.use('/reporter', reporterRouter);
app.use('/search/news', newsSearchRouter);
app.use('/search/media', mediaSearchRouter);
app.use('/search/reporter', reporterSearchRouter);
app.use('/api/news', newsApiRouter);
app.use('/api/media', mediaApiRouter);
app.use('/api/reporter', reporterApiRouter);
app.use('/api/selectReporter', selectReporterApiRouter);

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


module.exports = app;
