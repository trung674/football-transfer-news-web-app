var express = require('express');
var router = express.Router();
var connection = require('../config/database');
var T = require('../config/twitter.js');
var mysql = require('mysql');
var moment = require('moment');

router.get('/api/tweet', function(req, res, next)  {
    res.json({message: 'Hi from the web server :)'});
    // res.send('respond with a resource');
});

router.post('/api/search', function(req, res, next)  {
    console.log('efe')
    console.log(req.body);



    var basicKW = 'transfer OR buy OR bid OR moving OR move';
    var query = basicKW;
    var streamQuery = ''; // this is used to recieve new tweets
    var queryOption = req.body.queryOption;
    var player;
    var team;
    var author;
    if (req.body.player) {
        player = req.body.player;
        query = query + ' AND ' + splitQuery(player);
    } // + " OR " + completeQuery(player,1)

    if (req.body.team) {
        team = req.body.team;
        query = query + ' ' + queryOption +  ' ' + splitQuery(team);
    } // + " OR " + completeQuery(team,1)

    if (req.body.author) {
        author = req.body.author.replace(/@/g, "")
        query = query + ' from:' + author; // add author to query
    }

    connection.query("SELECT * FROM query WHERE query_text = '" + query + "'", function(error, results, fields) {
      if (results.length === 0) {
        var searchConfig = {q: query, count: 100, exclude: 'retweets', lang: 'en'};
        // Only get 100 tweets instead of 300
        T.get('search/tweets', searchConfig, function(err, data, response) {
          console.log("Number of tweets from the API: " + data.statuses.length);
          var tweets = data.statuses;
          // Update data in remote DB
          insertQueryAndTweets(tweets, query, player, team, author, function() {
            connection.query("SELECT * FROM query ORDER BY created_at DESC LIMIT 1", function(err, results, fields) {
              var query_id = results[0].query_id;
              // send JSON
              res.json({tweets: tweets, query_id: query_id, new: true});
            });
          });
        });
      } else {
        var localTweets = req.body.localTweets;
        var lastSearched = moment(results[0].created_at).format("YYYY-MM-DD");
        var query_id = results[0].query_id;
        connection.query("SELECT * FROM tweet WHERE query_id = '" + query_id + "'", function(error, results, fields) {
          var lastMaxId = results[results.length - 1].tweet_id;
          // Only get 100 tweets instead of 300
          var searchConfig = {since_id: lastMaxId, q: query, count: 100, exclude: 'retweets', lang: 'en', since: lastSearched};
          T.get('search/tweets', searchConfig, function(err, data, response) {
            console.log("Number of tweets from the API: " + data.statuses.length);
            var tweets = data.statuses;
            var remoteTweets = [];
            console.log("local tweets: " + localTweets);
            console.log("remote tweets: " + results.length);
            // calculate the difference between the number of tweets in cordova DB and remote DB
            if (results.length > localTweets) {
              var temp = results.slice(- results.length + localTweets);
              remoteTweets = remoteTweets.concat(temp);
              console.log("Number of tweets to be added from remote DB to corcoda DB: " + remoteTweets.length);
            }
            // Update data in remote DB
            insertQueryAndTweets(data.statuses, query, player, team, author, function() {
              // Send JSON
              res.json({tweets: tweets, remoteTweets: remoteTweets, query_id: query_id, new: false});
            });
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

function insertTweets(tweets, query) {
 // insert query into the database.
 connection.query("SELECT * FROM query WHERE query_text = '" + query + "'", function(error, results, fields) {
   var query_id = results[0].query_id;
   var tweetsArray = [];
   for (var tweet of tweets) {
     var tweet_id = tweet.id_str // tweet id
     var tweet_text = tweet.text // tweet text
     var username = tweet.user.screen_name // screen name of user who tweeted it
     var created_at = new Date(tweet.created_at) // when user tweeted it
     var created_at_str = created_at.toISOString().substring(0, 19).replace('T', ' ') //why we need this ?
     var tweetArray = [tweet_id, tweet_text, username, created_at, query_id];
     tweetsArray.push(tweetArray);
   }
   var sql = "INSERT INTO tweet (tweet_id, tweet_text, username, created_at, query_id) VALUES ?";
   connection.query(sql, [tweetsArray], function(error) {
       if (error) {
         throw error;
       } else {
         console.log("Successfully added " + tweetsArray.length + " more tweets.");
       }
   });
 });
}

function insertQueryAndTweets(tweets, query, player, team, author, callback) {
 connection.query("SELECT * FROM query WHERE query_text = '" + query + "'", function(error, results, fields) {
   // check if query exists in database
   if (results.length === 0) { //if yes, add query to database
     var message = {
       query_text: query,
       player_name: player,
       team: team,
       author: author
     };
     connection.query("INSERT INTO query SET ?", message, function(error, results, fields) {
       if (error) {
           throw error;
       } else {
         console.log("Successfully add query: " + query);
         if (tweets.length > 0) {
          insertTweets(tweets, query);
         }
         if (callback) callback();
       }
     });
   } else { // if no, update the value of created_at field
     connection.query("UPDATE query SET created_at = NOW() WHERE query_text ='" + query + "'", function(error, results, fields) {
       if (error) {
           throw error;
       } else {
         console.log("Successfully update query " + query);
         if (tweets.length > 0) {
           insertTweets(tweets, query);
         }
         if (callback) callback();
       }
     });
   }
 });
}
