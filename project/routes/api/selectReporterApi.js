require('dotenv').config();
const express = require('express');
const router = express.Router();
const mysql = require('../../util/mysqlcon');
const db = require('./api_db');
const cst = require('../../util/consts')
const redis = require('redis');
const client = redis.createClient({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT
});
const { promisify } = require('util');
const getAsync = promisify(client.get).bind(client);

client.on('connect', () => {
  console.log('Redis connected');
});

router.use("/", function (req, res, next) {
  res.set("Access-Control-Allow-Origin", cst.HOST_NAME);
  res.set("Access-Control-Allow-Headers", "Origin, Content-Type");
  res.set("Access-Control-Allow-Methods", "GET");
  // res.set("Access-Control-Allow-Credentials", "true");
  next();
});

router.get('/', async function (req, res, next) {
  try {
    let reporterNames = JSON.parse(await getAsync('reporterNames'));
 
    if (reporterNames == null) {
      console.log("no reporter's name from redis")
      let reporterNames = await db.getReporterName();
      res.json(reporterNames);
      client.set("reporterNames", JSON.stringify(reporterNames));
    }else{
      console.log("get reporter's name from redis")
      res.json(reporterNames);
    }
  } catch (e) {
    res.send(e)
  }
});

module.exports = router;
