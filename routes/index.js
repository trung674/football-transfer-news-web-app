var express = require('express');
var router = express.Router();
require('dotenv').config();
var configDB = require('../config/database');

var Twit = require('twit')
var mysql = require('mysql')

var T = new Twit({
  consumer_key:         process.env.TWIT_CONSUMER_KEY,
  consumer_secret:      process.env.TWIT_CONSUMER_SECRET,
  access_token:         process.env.TWIT_ACCESS,
  access_token_secret:  process.env.TWIT_ACCES_SECRET,
  timeout_ms:           60*1000,  // optional HTTP request timeout to apply to all requests.
})


var connection = mysql.createConnection({
  host     : configDB.host,
  user     : configDB.user,
  password : configDB.password,
  database : configDB.database
});

connection.connect(function(err){
  if(err){
    console.log('Error connecting to Db');
    return;
  }
  console.log('Connection established');
});

connection.query('SELECT * FROM query', function (error, results, fields) {
  if (error) throw error;

  console.log(results)
});


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'EMT Football Tweets' });
});

router.post('/', function(req, res, next) {
  if (req.body.player) var player = req.body.player;
  if (req.body.team) var team = req.body.team;
  if (req.body.author) var author = req.body.author;
  var query = player + ' AND ' + team;
  var currentdate = new Date();
  var datetime = currentdate.getDate() + "-"
                + (currentdate.getMonth()+1)  + "-"
                + currentdate.getFullYear() + " @ "
                + currentdate.getHours() + ":"
                + currentdate.getMinutes() + ":"
                + currentdate.getSeconds();
  T.get('search/tweets', { q: query, count: 5 }, function(err, data, response) {

    for(tweet = 0; tweet < data.statuses.length; tweet++){
      var tweet_id = data.statuses[tweet].id_str
      var tweet_text = data.statuses[tweet].text
      var username = data.statuses[tweet].user.screen_name
      var created_at = new Date(data.statuses[tweet].created_at)
      var created_at_str = created_at.toISOString().substring(0, 19).replace('T', ' ')

      var post  = {tweet_id: tweet_id, tweet_text: tweet_text, username: username, created_at: created_at_str};
      connection.query('INSERT INTO tweet SET ?', post, function (error, results, fields) {
        if (error) throw error;
      });
      console.log(query.sql)
    }
    if(data.statuses.length>0){
    var message  = {query_text: query, player_name: player, team: team, author:author};
    connection.query('INSERT INTO query SET ?',message, function (error, results, fields) {
      if (error) throw error;
    });
    console.log(query.sql)

    }
    res.render('index', {query: query, tweets: data.statuses});
  });

});

module.exports = router;
