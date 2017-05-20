/*
Connecting to the twitter STREAMING and REST API
Use REST API to get recent tweets
Use STREAMING API to get tweets as they occur.
Store tweets and queries in MySql database.

by Thanh Trung, Omorhefere Imoloame and Mahesha Kulatunga.

*/
var express = require('express');
var router = express.Router();
require('dotenv').config();
var mysql = require('mysql');
var moment = require('moment');
var connection = require('../config/database');
var T = require('../config/twitter.js');
var sparqls = require( 'sparqling-star' );
var ip = require("ip");
console.dir ( ip.address() );

module.exports = function(io) {

    /* GET home page. */
    router.get('/', function(req, res, next) {
        res.render('index', {title: 'EMT Football Tweets'});
    });
    // post query
    router.post('/', function(req, res, next) {
        // Construct query
        // transer keywords so only tweets relating to transfers are returned
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
            streamQuery = 'transfer ' + player + ',buy ' + player + ',bid ' + player + ',moving ' + player + ',move ' + player // create query for the stream API
        }

        if (req.body.team) {
            team = req.body.team;
            query = query + ' ' + queryOption +  ' ' + splitQuery(team);
            streamQuery = streamQuery + ' transfer ' + team + ',buy ' + team + ',bid ' + team + ',moving ' + team + ',move ' + team
        }

        if (req.body.author) {
            author = req.body.author.replace(/@/g, "")
            query = query + ' from:' + author; // add author to query
        }
        if (query !== basicKW) {
            if (req.body.api) {
                console.log("REST query: " + query);
                console.log("Stream query: "+ streamQuery);

                //Initiate twittter tweet stream API and send new tweets to front end when recieved
                io.on('connection', function(socket) {
                    //stream new tweets
                    streamTweets(streamQuery, io)
                });

                // Get tweets from REST API with 4 iterations
                var tweetCollection = [];
                connection.query("SELECT * FROM query WHERE query_text = '" + query + "'", function(error, results, fields) {
                    // if the query already existed in database, search with "since" and "since_id" property, else normal search
                    if (results.length === 1) {
                        var query_id = results[0].query_id;
                        var lastSearched = moment(results[0].created_at).format("YYYY-MM-DD");
                        connection.query("SELECT tweet_id FROM tweet WHERE query_id = '" + query_id + "' ORDER BY created_at DESC LIMIT 1 ", function(error, results, fields) {
                            var lastMaxId = results[0].tweet_id;
                            // Search only next 100 tweets are enough I guess
                            T.get('search/tweets', {
                                since_id: lastMaxId,
                                q: query,
                                count: 100,
                                exclude: 'retweets',
                                lang: 'en',
                                since: lastSearched
                            }, function(err, data, response) {
                                console.log("First iteration: " + data.statuses.length);
                                tweetCollection = tweetCollection.concat(data.statuses);
                                console.log("Total tweets from API: " + tweetCollection.length);
                                getRecAndRender(io, tweetCollection, player, team, author, query, true, req, res, query_id);
                            });
                        });
                    } else {
                      var options = {q: query, count: 100, exclude: 'retweets', lang: 'en'};
                      T.get('search/tweets', options, function(err, data, response) {
                          console.log("First iteration: " + data.statuses.length);
                          if (data.statuses.length === 0) { // no tweets returned => render immediately
                              res.render('index', {
                                query: query,
                                player: player,
                                team: team,
                                author  : author
                              });
                          } else {
                              tweetCollection = tweetCollection.concat(data.statuses);
                              options.max_id = data.statuses.pop().id_str;
                              T.get('search/tweets', options, function(err1, data1, response1) {
                                  console.log("Second iteration: " + data1.statuses.length);
                                  if (data1.statuses.length === 1) {
                                      getRecAndRender(io, tweetCollection, player, team, author, query, false, req, res);
                                  } else {
                                      data1.statuses.shift();
                                      tweetCollection = tweetCollection.concat(data1.statuses);
                                      options.max_id = data1.statuses.pop().id_str;
                                      T.get('search/tweets', options, function(err2, data2, response2) {
                                          console.log("Third iteration: " + data2.statuses.length);
                                          if (data2.statuses.length === 1) {
                                              getRecAndRender(io, tweetCollection, player, team, author, query, false, req, res);
                                          } else {
                                              data2.statuses.shift(); // remove the first duplicate tweet
                                              tweetCollection = tweetCollection.concat(data2.statuses);
                                              options.max_id = data2.statuses.pop().id_str;
                                              T.get('search/tweets', options, function(err3, data3, response3) {
                                                  console.log("Fourth iteration : " + data3.statuses.length);
                                                  if (data2.statuses.length === 1) {
                                                    getRecAndRender(io, tweetCollection, player, team, author, query, false, req, res);
                                                  } else {
                                                    data3.statuses.shift(); // remove the first duplicate tweet
                                                    tweetCollection = tweetCollection.concat(data3.statuses);
                                                    console.log("Total tweets from API: " + tweetCollection.length);
                                                    getRecAndRender(io, tweetCollection, player, team, author, query, false, req, res);
                                                  }
                                              });
                                          }
                                      });
                                  }
                              });
                          }
                      });
                    }
              });
            } else {
                //get results from the database
                console.log("Calling getDBResults")
                getDBResults(io, player, team, query, req, res);
            }
        } else {
            res.render('index', {message: 'Empty string'});
        }
    });

    return router;
};

function streamTweets(query, io) {
    // get new tweets according to query
    var stream = T.stream('statuses/filter', { track: query  });
    stream.on('tweet', function (tweet) {
        //console.log(tweet.text);
        //push new tweets to the front end
        io.emit('stream', tweet);
    });
}

// insert tweets into the database
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

// insert queries into the database
function insertQueryAndTweets(tweets, query, player, team, author) {
    connection.query("SELECT * FROM query WHERE query_text = '" + query + "'", function(error, results, fields) {
        // check if query is already existed in database
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
              }
            });
        }
    });
}

// function for offline searching, check if query in database
function getDBResults(io, player, team, query, req, res) {
    if (req.body.team !== '') {
        var id = [];
        // if team and player given
        connection.query('SELECT * FROM tweet WHERE tweet_text LIKE "%' + req.body.player + '%" AND tweet_text LIKE "%' + req.body.team + '%" ORDER BY created_at DESC', [req.body.player, req.body.team], function(error, results, fields) {
            if (error) {
                throw error;
            } else {
                var classifiedTweets = [];
                var tweetsDB = results;
                var dateList = findUniqueDates(tweetsDB);
                classifiedTweets = classifyTweets(dateList, tweetsDB, classifiedTweets);
                connection.query('SELECT DISTINCT player_name,team FROM query WHERE player_name LIKE "%' + req.body.player + '%" AND team LIKE "%' + req.body.team + '%" ORDER BY created_at DESC LIMIT 3;', [req.body.player,req.body.team], function(error, results, fields) {
                    if (error) {
                        throw error;
                    } else {
                        var recommendations = results;
                        connection.query('SELECT DISTINCT player_ID FROM db_player_names WHERE player_name LIKE "%' + req.body.player + '%" OR player_twitter="' + req.body.author + '" LIMIT 1;', [req.body.player,req.body.author], function(error, results, fields) { // if only player name is given
                            if (error) {
                                throw error;
                            } else {
                                if (results.length > 0) {
                                    getDBPInfo(io, results[0].player_ID, false, true, query, player, team, null, null, tweetsDB, tweetsDB, classifiedTweets, recommendations, moment, req, res);
                                } else {
                                    io.on('connection', function(socket) {
                                      io.emit('graph_info', classifiedTweets);
                                    });
                                    console.log("team + player DB");
                                    res.render('index', {
                                        query: query,
                                        player: player,
                                        team: team,
                                        DBtweets: tweetsDB,
                                        moment: moment,
                                        recommendations: recommendations,
                                        classifiedTweets: classifiedTweets
                                    });
                                }

                            }
                        });
                    }
                });
            }
        });
    } else {
        var id = [];
        // if only player given
        connection.query('SELECT * FROM tweet WHERE tweet_text LIKE "%' + req.body.player + '%" ORDER BY created_at DESC', req.body.player, function(error, results, fields) {
            if (error) {
                throw error;
            } else {
              var classifiedTweets = [];
              var tweetsDB = results;
              var dateList = findUniqueDates(tweetsDB);
              classifiedTweets = classifyTweets(dateList, tweetsDB, classifiedTweets);
              connection.query('SELECT DISTINCT player_name,team FROM query WHERE player_name LIKE "%' + req.body.player + '%" AND team LIKE "%' + req.body.team + '%" ORDER BY created_at DESC LIMIT 3;', [req.body.player,req.body.team], function(error, results, fields) {
                  if (error) {
                      throw error;
                  } else {
                      var recommendations = results;
                      connection.query('SELECT DISTINCT player_ID FROM db_player_names WHERE player_name LIKE "%' + req.body.player + '%" OR player_twitter="' + req.body.author + '" LIMIT 1;', [req.body.player,req.body.author], function(error, results, fields) { // if only player name is given
                          if (error) {
                              throw error;
                          } else {
                              if (results.length > 0) {
                                getDBPInfo(io, results[0].player_ID, false, true, query, player, team, null, null, tweetsDB, tweetsDB, classifiedTweets, recommendations, moment, req, res)
                              } else {
                                  console.log("player not on db");
                                  io.on('connection', function(socket) {
                                    io.emit('graph_info', classifiedTweets);
                                  });
                                  res.render('index', {
                                      query: query,
                                      player: player,
                                      team: team,
                                      DBtweets: tweetsDB,
                                      moment: moment,
                                      recommendations: recommendations,
                                      classifiedTweets: classifiedTweets
                                  });
                              }
                          }
                      });
                  }
              });
            }
        });
    }
}

// collect tweets from API and render HTML page
function getRecAndRender(io, tweets, player, team, author, query, isExisted, req, res, query_id) {
    var classifiedTweets = [];
    var tweetsDB = [];
    var tweetsAPI = tweets;

    if (isExisted) {
        connection.query("SELECT * FROM tweet WHERE query_id ='" + query_id + "'", function(error, results, fields) {
          insertQueryAndTweets(tweets, query, player, team, author);
          tweetsDB = tweetsDB.concat(results.reverse());
          tweets = tweets.concat(tweetsDB);
          var dateList = findUniqueDates(tweets);
          classifiedTweets = classifyTweets(dateList, tweets, classifiedTweets);
          if (req.body.team !== '') {
              var id = [];
              // find terms that are unique to to current query terms and render theem also
              connection.query('SELECT DISTINCT player_name,team FROM query WHERE player_name LIKE "%' + req.body.player + '%" AND team LIKE "%' + req.body.team + '%" ORDER BY created_at DESC LIMIT 3;', [req.body.player,req.body.team], function(error, results, fields) {
                  if (error) {
                      throw error;
                  } else {
                      if (results.length > 0) {
                      var recommendations = results;
                      connection.query('SELECT DISTINCT player_ID FROM db_player_names WHERE player_name LIKE "%' + req.body.player + '%" OR player_twitter="' + req.body.author + '" LIMIT 1;', [req.body.player,req.body.author], function(error, results, fields) { // if only player name is given
                          if (error) {
                              throw error;
                          } else {
                              if (results.length > 0) {
                                  getDBPInfo(io, results[0].player_ID, true, false, query, player, team, tweetsAPI, null, tweetsDB, null, classifiedTweets, recommendations, moment, req, res)
                              } else {
                                  console.log("player not on db");
                                  io.on('connection', function(socket) {
                                    io.emit('graph_info', classifiedTweets);
                                  });
                                  res.render('index', {
                                    query: query,
                                    player: player,
                                    team: team,
                                    tweets: tweetsAPI,
                                    author: author,
                                    DBtweets: tweetsDB,
                                    tweetsDB: tweetsDB.length,
                                    classifiedTweets: classifiedTweets,
                                    recommendations: recommendations,
                                    moment: moment
                                  });
                              }
                          }
                      });
                    }
                }
              });
          } else {
              var id = [];
              connection.query('SELECT DISTINCT player_name,team FROM query WHERE player_name LIKE "%' + req.body.player + '%" ORDER BY created_at DESC LIMIT 3;', req.body.player, function(error, results, fields) { // if only player name is given
                  if (error) {
                      throw error;
                  } else {
                      var recommendations = results;
                      connection.query('SELECT DISTINCT player_ID FROM db_player_names WHERE player_name LIKE "%' + req.body.player + '%" OR player_twitter="' + req.body.author + '" LIMIT 1;', [req.body.player,req.body.author], function(error, results, fields) { // if only player name is given
                          if (error) {
                              throw error;
                          } else {
                              if (results.length > 0){
                                  getDBPInfo(io, results[0].player_ID, true, false, query, player, team, tweetsAPI, null, tweetsDB, null, classifiedTweets, recommendations, moment, req, res)
                              } else {
                                  console.log("player not on db");
                                  io.on('connection', function(socket) {
                                    io.emit('graph_info', classifiedTweets);
                                  });
                                  res.render('index', {
                                    query: query,
                                    player: player,
                                    team: team,
                                    tweets: tweetsAPI,
                                    author: author,
                                    DBtweets: tweetsDB,
                                    tweetsDB: tweetsDB.length,
                                    classifiedTweets: classifiedTweets,
                                    recommendations: recommendations,
                                    moment: moment
                                  });
                              }
                          }
                      });
                  }
              });
          }
        });
    } else {
        insertQueryAndTweets(tweets, query, player, team, author);
        var dateList = findUniqueDates(tweets);
        classifiedTweets = classifyTweets(dateList, tweets, classifiedTweets);
        if (req.body.team !== '') {
            var id = [];
            // find terms that are unique to to current query terms and render theem also
            connection.query('SELECT DISTINCT player_name,team FROM query WHERE player_name LIKE "%' + req.body.player + '%" OR team LIKE "%' + req.body.team + '%" ORDER BY created_at DESC LIMIT 3;', [req.body.player,req.body.team], function(error, results, fields) {
                if (error) {
                    throw error;
                } else {
                  var recommendations = results;
                  connection.query('SELECT DISTINCT player_ID FROM db_player_names WHERE player_name LIKE "%' + req.body.player + '%" OR player_twitter="' + req.body.author + '" LIMIT 1;', [req.body.player,req.body.author], function(error, results, fields) { // if only player name is given
                      if (error) {
                          throw error;
                      } else {
                          if (results.length > 0) {
                              getDBPInfo(io, results[0].player_ID, false, false, query, player, team, null, null, null, null, classifiedTweets, recommendations, moment, req, res)
                          } else {
                              io.on('connection', function(socket) {
                                io.emit('graph_info', classifiedTweets);
                              });
                              res.render('index', {
                                  query: query,
                                  player: player,
                                  team: team,
                                  tweets: tweets,
                                  classifiedTweets: classifiedTweets,
                                  recommendations: recommendations,
                                  moment: moment
                              });
                          }
                      }
                  });
                }
            });
          } else {
              var id = [];
              connection.query('SELECT DISTINCT player_name,team FROM query WHERE player_name LIKE "%' + req.body.player + '%" ORDER BY created_at DESC LIMIT 3;', req.body.player, function(error, results, fields) { // if only player name is given
                  if (error) {
                      throw error;
                  } else {
                      var recommendations = results;
                      connection.query('SELECT DISTINCT player_ID FROM db_player_names WHERE player_name LIKE "%' + req.body.player + '%" OR player_twitter="' + req.body.author + '" LIMIT 1;', [req.body.player,req.body.author], function(error, results, fields) { // if only player name is given
                          if (error) {
                              throw error;
                          } else {
                              if (results.length > 0){
                                getDBPInfo(io, results[0].player_ID, false, false, query, player, team, null, null, null, tweets, classifiedTweets, recommendations, moment, req, res)
                              } else {
                                  io.on('connection', function(socket) {
                                    io.emit('graph_info', classifiedTweets);
                                  });
                                  res.render('index', {
                                      query: query,
                                      player: player,
                                      team: team,
                                      tweets: tweets,
                                      classifiedTweets: classifiedTweets,
                                      recommendations: recommendations,
                                      moment: moment
                                  });
                              }

                          }
                      });
                  }
              });
          }
      }
}


function getDBPInfo(io, player_id, fromCache, fromDB, query, player, team, tweetsAPI, author, tweetsDB, tweets, classifiedTweets, recommendations, moment, req, res) {
    var myquery = new sparqls.Query({
        'limit': 1
    });

    var DBplayer = {
      	'dbo:wikiPageID': player_id,
        'dbp:name': '?name',
        'dbo:birthDate': '?birthDate',
        'dbp:currentclub': '?currentclub',
        'dbp:position': '?position',
        'dbo:thumbnail': '?thumbnail'
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
        if (data.results.bindings[0] !== undefined) {
            var db_player_name = data.results.bindings[0].name.value;
            var db_player_dob = data.results.bindings[0].birthDate.value;
            var db_position_uri = data.results.bindings[0].position.value;
            var db_position = formatURI(db_position_uri);
            var db_team_uri = data.results.bindings[0].currentclub.value;
            var db_team = formatURI(db_team_uri);
            var db_thumbnail = data.results.bindings[0].thumbnail.value;
            var DBpediaInfo = {
              playerInfo: [
                {"name":db_player_name},
                {"dob":db_player_dob},
                {"team":db_team},
                {"position":db_position},
                {"thumbnail":db_thumbnail}
              ]};
        } else {
            var DBpediaInfo = {
              playerInfo: [
            {"name":''},
            {"dob":''},
            {"team":''},
            {"position":''},
            {"thumbnail":''}
            ]}
        }

        if (fromCache) {
            io.on('connection', function(socket) {
              io.emit('graph_info', classifiedTweets);
            });
            res.render('index', {
              query: query,
              player: player,
              team: team,
              tweets: tweetsAPI,
              author: author,
              DBtweets: tweetsDB,
              tweetsDB: tweetsDB.length,
              classifiedTweets: classifiedTweets,
              recommendations: recommendations,
              DBpediaInfo: DBpediaInfo,
              moment: moment
            });
        } else if (fromDB) {
            io.on('connection', function(socket) {
              io.emit('graph_info', classifiedTweets);
            });
            res.render('index', {
                query: query,
                player: player,
                team: team,
                DBtweets: tweets,
                tweetsDB: tweetsDB.length,
                recommendations: recommendations,
                DBpediaInfo: DBpediaInfo,
                moment: moment,
                classifiedTweets: classifiedTweets
            });
        } else {
            io.on('connection', function(socket) {
              io.emit('graph_info', classifiedTweets);
            });
            res.render('index', {
                query: query,
                player: player,
                team: team,
                tweets: tweets,
                classifiedTweets: classifiedTweets,
                recommendations: recommendations,
                moment: moment,
                DBpediaInfo: DBpediaInfo
            });
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
