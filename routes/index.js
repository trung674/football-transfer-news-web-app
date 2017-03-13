var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

module.exports = router;

var Twit = require('twit')

var T = new Twit({
  consumer_key:         'jvtynKirqBGX244KcVKY2Wtjr',
  consumer_secret:      'jlcB6UdocRSE9eJK0DLtVL17Z76J4Fq34EdUGqptNCQuz1K5lg',
  access_token:         '3042587398-eRZ1k50xbgh3azxGDG5JlQaW4p9ONwTeegZSEPG',
  access_token_secret:  'wQmPPNFDRiDOHuM4jHK4TVuSQ9EEHz7JdVBqZ3YtWq1Fn',
  timeout_ms:           60*1000,  // optional HTTP request timeout to apply to all requests.
})
