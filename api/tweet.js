var express = require('express');
var router = express.Router();
var connection = require('../config/database');
var T = require('../config/twitter.js');
var mysql = require('mysql');
var moment = require('moment');

router.get('/api/tweet', function(req, res, next)  {
    res.json({message: 'Hi there'});
    // res.send('respond with a resource');
});

router.get('/api/search', function(req, res, next)  {
    var localTweets = req.params.lctweets;
    var basicKW = 'transfer OR buy OR bid OR moving OR move';
    var query = basicKW;
    var streamQuery = ''; // this is used to recieve new tweets
    var queryOption = req.params.queryOption;
    var player;
    var team;
    var author;
    if (req.params.player) {
        player = req.params.player;
        query = query + ' AND ' + splitQuery(player);
    } // + " OR " + completeQuery(player,1)

    if (req.params.team) {
        team = req.params.team;
        query = query + ' ' + queryOption +  ' ' + splitQuery(team);
    } // + " OR " + completeQuery(team,1)

    if (req.params.author) {
        author = req.params.author.replace(/@/g, "")
        query = query + ' from:' + author; // add author to query
    }

    connection.query("SELECT * FROM query WHERE query_text = '" + query + "'", function(error, results, fields) {
      if (results.length === 0) {
        var searchConfig = {q: query, count: 100, exclude: 'retweets', lang: 'en'};
        // Only get 100 tweets instead of 300
        T.get('search/tweets', searchConfig, function(err, data, response) {
          console.log(data.statuses.length);
          var tweets = data.statuses;
          res.json({tweets: tweets});
        });
      } else {
        var lastSearched = moment(results[0].created_at).format("YYYY-MM-DD");
        connection.query("SELECT tweet_id FROM tweet WHERE query_id = '" + query_id + "' ORDER BY created_at DESC LIMIT 1 ", function(error, results, fields) {
          var lastMaxId = results[0].tweet_id;
          var searchConfig = {since_id: lastMaxId, q: query, count: 100, exclude: 'retweets', lang: 'en', since: lastSearched};
          T.get('search/tweets', searchConfig, function(err, data, response) {
            console.log(data.statuses.length);
            var tweets = data.statuses;
            res.json({tweets: tweets});
          });
        });
      }
    });
});

module.exports = router;

function splitQuery(queryString) {
  var words = queryString.split(",");
  var fullQuery = "";

  for (var i = 0; i < words.length; i++) {
    if (i === words.length - 1) {
      fullQuery = fullQuery + words[i];
    } else {
      fullQuery = fullQuery + words[i] + " OR";
    }
  }
  return fullQuery;
 }
