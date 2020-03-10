/* eslint-disable max-len */
const mysql = require('mysql');
require('dotenv').config();
const {NODE_ENV} = process.env;
const host = NODE_ENV === 'test' ? process.env.TESTMYSQL_HOST : process.env.MYSQL_HOST;
const user = NODE_ENV === 'test' ? process.env.TESTMYSQL_USER : process.env.MYSQL_USER;
const password = NODE_ENV === 'test' ? process.env.TESTMYSQL_PASSWORD : process.env.MYSQL_PASSWORD;
const database = NODE_ENV === 'test' ? process.env.TESTMYSQL_DATABASE : process.env.MYSQL_DATABASE;
const port = NODE_ENV === 'test' ? process.env.TESTMYSQL_PORT : process.env.MYSQL_PORT;

module.exports = mysql.createPool({
  host: host,
  user: user,
  password: password,
  database: database,
  port: port,
});
