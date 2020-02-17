const express = require('express');
const router = express.Router();
const mysql = require('../../util/mysqlcon');

router.get('/', function (req, res, next) {
const media = req.query.media;

let sql=`SELECT name FROM reporter WHERE media='${media}'`;
mysql.query(sql, function(err, result){
    if(err){
        console.log(err);
    }
    let name =[];
    for (let i=0;i<result.length;i++){
        name.push(result[i].name);
    }
    res.json(name);
})
});

module.exports = router;