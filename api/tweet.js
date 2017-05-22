var express = require('express');
var router = express.Router();
var connection = require('../config/database');
var T = require('../config/twitter.js');
var mysql = require('mysql');
var moment = require('moment');
var sparqls = require( 'sparqling-star' );


router.get('/api/tweet', function(req, res, next)  {
    res.json({message: 'Hi from the web server :)'});
});

router.post('/api/search', function(req, res, next)  {

    // Contruct query
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
    }

    if (req.body.team) {
        team = req.body.team;
        query = query + ' ' + queryOption +  ' ' + splitQuery(team);
    }

    if (req.body.author) {
        author = req.body.author.replace(/@/g, "")
        query = query + ' from:' + author; // add author to query
    }

    connection.query("SELECT * FROM query WHERE query_text = '" + query + "'", function(error, results, fields) {
        if (results.length === 0) { // query is not existed
            var searchConfig = {q: query, count: 100, exclude: 'retweets', lang: 'en'};
            // Only get 100 tweets instead of 300
            T.get('search/tweets', searchConfig, function(err, data, response) {
                console.log("1. Number of tweets from the API: " + data.statuses.length);
                var tweets = data.statuses;
                if (tweets.length !== 0) { // if there are tweets returned
                  // Update data in remote DB
                  insertQueryAndTweets(tweets, query, player, team, author, function() {
                      // Find the query_id of the newest query in DB
                      connection.query("SELECT * FROM query ORDER BY created_at DESC LIMIT 1", function(err, results, fields) {
                          var query_id = results[0].query_id;
                          // send JSON
                          var classifiedTweets = [];
                          var dateList = findUniqueDates(tweets);
                          classifiedTweets = classifyTweets(dateList, tweets, classifiedTweets);

                          connection.query('SELECT DISTINCT player_ID FROM db_player_names WHERE player_name LIKE "%' + req.body.player + '%" OR player_twitter="' + req.body.author + '" LIMIT 1;', [req.body.player,req.body.author], function(error, results, fields) {
                            console.log(results + "NEW")
                            if (results.length === 0){
                              res.json({tweets: tweets, classifiedTweets: classifiedTweets, query_id: query_id, isFound: true});
                            }
                            else {
                              getDBPInfo(results[0].player_ID, tweets, null, null, classifiedTweets, query_id, true, res, true)
                            }
                          })
                      });
                  });
                } else { // if 0 tweet returned
                  res.json({isFound: false});
                }

            });
        } else { // query is already existed
            var localTweets = req.body.localTweets;
            var lastSearched = moment(results[0].created_at).format("YYYY-MM-DD");
            var query_id = results[0].query_id;
            // Find the max tweet ID
            connection.query("SELECT * FROM tweet WHERE query_id = '" + query_id + "'", function(error, results, fields) {
                var lastMaxId = results[results.length - 1].tweet_id;
                var dbTweets = results.slice(-100); // Get the last 100 tweets
                // Only get 100 tweets instead of 300
                //get all tweets for freq analysis
                var tweetsToClassify = results;
                var searchConfig = {since_id: lastMaxId, q: query, count: 100, exclude: 'retweets', lang: 'en', since: lastSearched};
                T.get('search/tweets', searchConfig, function(err, data, response) {
                    console.log("Number of tweets from the API: " + data.statuses.length);
                    var tweets = data.statuses;
                    var remoteTweets = [];
                    console.log("Local tweets: " + localTweets);
                    console.log("Remote tweets: " + results.length);
                    // calculate the difference between the number of tweets in cordova DB and remote DB
                    if (results.length > localTweets) {
                        var temp = results.slice(localTweets - results.length);
                        remoteTweets = remoteTweets.concat(temp);
                        console.log("Number of tweets to be added from remote DB to corcoda DB: " + remoteTweets.length);
                    }

                    var classifiedTweets = [];
                    var dateList = findUniqueDates(tweetsToClassify);
                    classifiedTweets = classifyTweets(dateList, tweetsToClassify, classifiedTweets);

                    // Update data in remote DB
                    connection.query('SELECT DISTINCT player_ID FROM db_player_names WHERE player_name LIKE "%' + req.body.player + '%" OR player_twitter="' + req.body.author + '" LIMIT 1;', [req.body.player,req.body.author], function(error, results, fields) {
                      if (results.length === 0){
                        res.json({tweets: tweets, dbTweets: dbTweets, remoteTweets: remoteTweets,classifiedTweets: classifiedTweets, query_id: query_id, isFound: true});
                      }
                      else {
                        getDBPInfo(results[0].player_ID, tweets, dbTweets, remoteTweets, classifiedTweets, query_id, true, res, false)
                      }
                    })
                    insertQueryAndTweets(data.statuses, query, player, team, author, function() {
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
                     if (typeof callback === 'function') callback();
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
                   if (typeof callback === 'function') callback();
               }
             });
         }
    });
}

function getDBPInfo(player_id, tweets, dbTweets, remoteTweets, classifiedTweets, query_id, isFound, res, newQuery) {
    var myquery = new sparqls.Query({
        'limit': 1
    });

    var DBplayer = {
      	'dbo:wikiPageID': player_id,
        'dbp:name': '?name',
        'dbo:birthDate': '?birthDate',
        'dbp:currentclub': '?currentclub',
        'dbp:position': '?position'
    };

    myquery.registerVariable( 'DBplayer', DBplayer )
       .registerPrefix( 'dbres', '<http://dbpedia.org/resource/>' )
       .registerPrefix( 'dbowl', '<http://dbpedia.org/ontology/>' )
       .registerPrefix( 'dbprop', '<http://dbpedia.org/property/>' )
       //.selection( 'birthDate' )
       ;

    var sparqler = new sparqls.Client();
    //console.log(myquery.sparqlQuery)
    sparqler.send( myquery, function( error, data ) {

            var db_player_name = data.results.bindings[0].name.value;
            var db_player_dob = data.results.bindings[0].birthDate.value;
            var db_position_uri = data.results.bindings[0].position.value;
            var db_position = formatURI(db_position_uri);
            var db_team_uri = data.results.bindings[0].currentclub.value;
            var db_team = formatURI(db_team_uri);
            var DBpediaInfo = {
              playerInfo: [
                {"name":db_player_name},
                {"dob":db_player_dob},
                {"team":db_team},
                {"position":db_position}
              ]};
      if (newQuery){
        res.json({tweets: tweets, classifiedTweets: classifiedTweets, query_id: query_id, isFound: isFound, DBpediaInfo: DBpediaInfo});
      }
      else {
        res.json({tweets: tweets, dbTweets: dbTweets, remoteTweets: remoteTweets, classifiedTweets: classifiedTweets, query_id: query_id, isFound: isFound, DBpediaInfo: DBpediaInfo});
      }
    });
}

function formatURI(string) {
    cutIndex = string.lastIndexOf("/");
    string = string.substring(cutIndex+1, string.length);
    string = string.replace(/_/g,' ')
    return string;
}

function findUniqueDates(tweets) {
    // return the dates that tweets were created
    var array = tweets.map(function(tweet) {
        return new Date(tweet.created_at);
    });

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
    //find frequency of recent tweets.
    dates.forEach(function(date) {
        var tempArray = tweets.filter(function(tweet) {
            return (new Date(tweet.created_at).getDate() == date);
        });
        array.push(tempArray);
    });
    return array;
}
