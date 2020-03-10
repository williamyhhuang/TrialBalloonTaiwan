const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const newsRouter = require('./routes/news');
const mediaRouter = require('./routes/media');
const reporterRouter = require('./routes/reporter');
const newsSearchRouter = require('./routes/newsSearch');
const mediaSearchRouter = require('./routes/mediaSearch');
const reporterSearchRouter = require('./routes/reporterSearch');
const newsApiRouter = require('./routes/api/newsApi');
const mediaApiRouter = require('./routes/api/mediaApi');
const reporterApiRouter = require('./routes/api/reporterApi');
const selectReporterApiRouter = require('./routes/api/selectReporterApi');
const homeRouter = require('./routes/home');
const aboutRouter = require('./routes/about');
const app = express();
const mysql = require('./util/mysqlcon');

mysql.getConnection(function(err, connect) {
  if (err) {
    console.log('mysql is not connected');
  } else {
    console.log('mysql connected');
  }
});
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', homeRouter);
app.use('/home', homeRouter);
app.use('/news', newsRouter);
app.use('/media', mediaRouter);
app.use('/about', aboutRouter);
app.use('/reporter', reporterRouter);
app.use('/search/news', newsSearchRouter);
app.use('/search/media', mediaSearchRouter);
app.use('/search/reporter', reporterSearchRouter);
app.use('/api/news', newsApiRouter);
app.use('/api/media', mediaApiRouter);
app.use('/api/reporter', reporterApiRouter);
app.use('/api/selectReporter', selectReporterApiRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
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
