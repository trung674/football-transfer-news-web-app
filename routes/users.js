/*
Credentials for accessing MySql database provided by university.
by Thanh Trung, Omorhefere Imoloame and Mahesha Kulatunga.



*/
var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

module.exports = router;
