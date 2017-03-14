var express = require('express');
var router = express.Router();
require('dotenv').config()
var Twit = require('twit')
var T = new Twit({
  consumer_key:         process.env.TWIT_CONSUMER_KEY,
  consumer_secret:      process.env.TWIT_CONSUMER_SECRET,
  access_token:         process.env.TWIT_ACCESS,
  access_token_secret:  process.env.TWIT_ACCES_SECRET,
  timeout_ms:           60*1000,  // optional HTTP request timeout to apply to all requests.
})

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'EMT Football Tweets' });
});

router.post('/', function(req, res, next) {
  if (req.body.player) var player = req.body.player;
  if (req.body.team) var team = req.body.team;
  if (req.body.author) var author = req.body.author;
  var query = player + ' AND ' + team;
  T.get('search/tweets', { q: query, count: 1 }, function(err, data, response) {




    res.render('index', {query: query, tweets: data.statuses});
  });

});

module.exports = router;
