var express = require('express');
var router = express.Router();
require('dotenv').config()

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'EMT Football Tweets' });
});

module.exports = router;

var Twit = require('twit')

var T = new Twit({
  consumer_key:         process.env.TWIT_CONSUMER_KEY,
  consumer_secret:      process.env.TWIT_CONSUMER_SECRET,
  access_token:         process.env.TWIT_ACCESS,
  access_token_secret:  process.env.TWIT_ACCES_SECRET,
  timeout_ms:           60*1000,  // optional HTTP request timeout to apply to all requests.
})
