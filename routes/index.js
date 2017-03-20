var express = require('express');
var router = express.Router();
require('dotenv').config();
var configDB = require('../config/database');

var Twit = require('twit')
var mysql = require('mysql')

var T = new Twit({
    consumer_key: process.env.TWIT_CONSUMER_KEY,
    consumer_secret: process.env.TWIT_CONSUMER_SECRET,
    access_token: process.env.TWIT_ACCESS,
    access_token_secret: process.env.TWIT_ACCES_SECRET,
    timeout_ms: 60 *1000, // optional HTTP request timeout to apply to all requests.
})

var connection = mysql.createConnection({host: configDB.host, user: configDB.user, password: configDB.password, database: configDB.database});

connection.connect(function(err) {
    if (err) {
        console.log('Error connecting to Db' + err);
        return;
    }
    console.log('Connection established');
});

// connection.query('SELECT * FROM query', function(error, results, fields) {
//     if (error)
//         throw error;
//
//     console.log(results)
// });

//connection.query('SELECT * FROM tweet', function (error, results, fields) {
//  if (error) throw error;
//  console.log(results)
//});

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', {title: 'EMT Football Tweets'});
});

router.post('/', function(req, res, next) {
    // The Twitter Search API can only search tweets that are published in the past 7 days
    // source: https://dev.twitter.com/rest/public/search
    var query = '';
    if (req.body.player) {
      var player = req.body.player;
      query = query + player;
    }

    if (req.body.team) {
      var team = req.body.team;
      query = query + ' AND ' + team;
    }

    if (req.body.author) {
      var author = req.body.author.replace (/@/g, "")
      query = query + ' from:' + author;
    }

    if (query !== '') {
      T.get('search/tweets', {
          q: query,
          count: 100
      }, function(err, data, response) {
          for (tweet = 0; tweet < data.statuses.length; tweet++) {

              var tweet_id = data.statuses[tweet].id_str

              var check = connection.query('SELECT * FROM tweet WHERE tweet_id =' + tweet_id, function(error, results, fields) {
                  if (error)
                      throw error;
                  }
              );

              if (check.results = null) {
                  var tweet_text = data.statuses[tweet].text
                  var username = data.statuses[tweet].user.screen_name
                  var created_at = new Date(data.statuses[tweet].created_at)
                  var created_at_str = created_at.toISOString().substring(0, 19).replace('T', ' ')

                  var post = {
                      tweet_id: tweet_id,
                      tweet_text: tweet_text,
                      username: username,
                      created_at: created_at
                  };
                  // there's no need to insert this into a variable
                  connection.query('INSERT INTO tweet SET ?', post, function(error, results, fields) {
                      if (error)
                          throw error;
                      }
                  );
              }
          }

          var classifiedTweets = [];
          if (data.statuses.length > 0) {
              // Frequency Analysis
              if (data.statuses.length > 0 ) {
                var dateList = findUniqueDates(data);
                classifiedTweets = classifyTweets(dateList, data, classifiedTweets);
              }

              var message = {
                  query_text: query,
                  player_name: player,
                  team: team,
                  author: author
              };
              connection.query('INSERT INTO query SET ?', message, function(error, results, fields) {
                  if (error)
                      throw error;
                  }
              );
          }
          res.render('index', {
              query: query,
              tweets: data.statuses,
              classifiedTweets: classifiedTweets
          });
      });
    } else {
      res.render('index', {message: 'Empty string'});
    }
}); 

module.exports = router;

function findUniqueDates(tweets) {
  // return the dates that tweets were created
  var array = tweets.statuses.map(function(tweet) {return new Date(tweet.created_at)});
  var list = [array[0].getDate()];
  for (var i = 1; i < array.length; i++) {
    var date = array[i].getDate();
    if (list.indexOf(date) == -1) {
      list.push(date);
    }
  }
  return list;
}

function classifyTweets(dates, tweets, array) {
  dates.forEach(function(date) {
    var tempArray = tweets.statuses.filter(function(tweet){
      return (new Date(tweet.created_at).getDate() == date);
    });
    array.push(tempArray);
  });
  return array;
}
