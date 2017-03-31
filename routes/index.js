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
var configDB = require('../config/database');

var Twit = require('twit')
var mysql = require('mysql')
var app = require('../app');
var moment = require('moment');
var T = new Twit({
    consumer_key: process.env.TWIT_CONSUMER_KEY,
    consumer_secret: process.env.TWIT_CONSUMER_SECRET,
    access_token: process.env.TWIT_ACCESS,
    access_token_secret: process.env.TWIT_ACCES_SECRET,
    timeout_ms: 60 *1000, // optional HTTP request timeout to apply to all requests.
})

var connection = mysql.createConnection({host: configDB.host, user: configDB.user, password: configDB.password, database: configDB.database});//Configure the database

connection.connect(function(err) { //Connect the database.
    if (err) {
        console.log('Error connecting to Db' + err);
        return;
    }
    console.log('Connection established');

});

connection.query('SELECT * FROM tweet WHERE tweet_text LIKE "%Ronaldo%" ORDER BY created_at DESC LIMIT 1', function(error, results, fields) {
    if (error)
        throw error;
        //console.log(results)
    }
);

connection.query('SELECT * FROM tweet', function(error, results, fields) {
    if (error)
        throw error;
        //console.log(results)
    }
);

module.exports = function(io) {

    /* GET home page. */
    router.get('/', function(req, res, next) {

        res.render('index', {title: 'EMT Football Tweets'});
    });

    var query = ''
    router.post('/', function(req, res, next) {
        var basicKW = 'transfer OR buy OR bid OR moving OR move AND ';
        query = basicKW;
        var streamQuery = ''
        var team = '';

        if (req.body.player) {
            player = req.body.player;
            query = query + player; //+ " OR " + splitQuery(player);
            streamQuery = 'transfer ' + player + ',buy ' + player + ',bid ' + player + ',moving ' + player + ',move ' + player
        } // + " OR " + completeQuery(player,1)

        if (req.body.team) {
            team = req.body.team;
            query = query + ' AND ' + team //+ " OR " + splitQuery(team);
            streamQuery = streamQuery + ' transfer ' + team + ',buy ' + team + ',bid ' + team + ',moving ' + team + ',move ' + team
        } // + " OR " + completeQuery(team,1)

        if (req.body.author) {
            var author = req.body.author.replace(/@/g, "")
            query = query + ' from:' + author;
        }

        if (query !== basicKW) {

            if (req.body.api) {
                var tweetCollection = [];
                // Welcome to callback hell

                io.on('connection', function(socket) {
                    console.log('Socket stream initiated')
                    // console.log(streamQuery)
                    streamTweets(streamQuery, io)

                });

                T.get('search/tweets', {
                    q: query,
                    count: 100
                }, function(err, data, response) {

                    tweetCollection = tweetCollection.concat(data.statuses);

                    T.get('search/tweets', {
                        max_id: data.statuses.pop().id_str,
                        q: query,
                        count: 100
                    }, function(err1, data1, response1) {
                        // remove duplicate tweet
                        data1.statuses.shift();
                        tweetCollection = tweetCollection.concat(data1.statuses);
                        T.get('search/tweets', {
                            max_id: data1.statuses.pop().id_str,
                            q: query,
                            count: 100
                        }, function(err2, data2, response2) {
                            // remove duplicate tweet
                            data2.statuses.shift();
                            tweetCollection.concat(data2.statuses);
                            // 4th call to compensate for removing dupicate tweets
                            T.get('search/tweets', {
                                max_id: data2.statuses.pop().id_str,
                                q: query,
                                count: 100
                            }, function(err3, data3, response3) {
                                // remove duplicate tweet
                                data3.statuses.shift();
                                tweetCollection = tweetCollection.concat(data3.statuses);
                                var classifiedTweets = [];
                                if (data.statuses.length > 0) {
                                    // Frequency Analysis
                                    var dateList = findUniqueDates(tweetCollection);
                                    classifiedTweets = classifyTweets(dateList, tweetCollection, classifiedTweets);
                                    insertQuery(tweetCollection, query, player, team, author);
                                }
                                for (t = 0; t < tweetCollection.length; t++) {
                                    insertTweets(tweetCollection, t);

                                }
                                getRecAndRender(tweetCollection, player, team, query, req, res, classifiedTweets);
                            });
                        });
                    });
                });
            } else {
                console.log(query)
                getDBResults(player, team, query, req, res);
            }
        } else {
            res.render('index', {message: 'Empty string'});
        }
    });

    return router;
};
function streamTweets(query, io) {
    var stream = T.stream('statuses/filter', { track: query  })
     stream.on('tweet', function (tweet) {
       console.log(tweet.text);
       io.emit('stream', tweet);
     })
}


function insertTweets(data, t) {
connection.query('SELECT query_id FROM query ORDER BY created_at DESC LIMIT 1;', function(error, results, fields) {
if (error) {
    throw error;
}
var tweet_id = data[t].id_str
var tweet_text = data[t].text
var username = data[t].user.screen_name
var created_at = new Date(data[t].created_at)
var created_at_str = created_at.toISOString().substring(0, 19).replace('T', ' ')
var query_id = results[0].query_id

var post = {
    tweet_id: tweet_id,
    tweet_text: tweet_text,
    username: username,
    created_at: created_at,
    query_id: query_id
};

connection.query('SELECT * FROM tweet WHERE tweet_id =' + mysql.escape(tweet_id), function(error, results, fields) {
    if (error) {
        throw error;
    }
    if (results.length === 0) {

        connection.query('INSERT INTO tweet SET ?', post, function(error, results, fields) {
            if (error) {
                throw error;
            } else {
                //console.log('tweet_inserted')
            }
        });
    }
});
});
}

function insertQuery(data, query, player, team, author) {
var message = {
query_text: query,
player_name: player,
team: team,
author: author
};
connection.query('INSERT INTO query SET ?', message, function(error, results, fields) {
if (error) {
    throw error;
} else {
    //console.log('query_inserted')
}
});
}

function getDBResults(player, team, query, req, res) {
if (team !== '') {
var id = []
var check = connection.query('SELECT * FROM tweet WHERE tweet_text LIKE "%' + player + '%" AND tweet_text LIKE "%' + team + '%" ORDER BY created_at DESC', [
    player, team
], function(error, results, fields) {
    if (error) {
        throw error;
    } else {
        res.render('index', {
            query: query,
            player: player,
            team: team,
            DBtweets: results
        });

    }
});
} else {
var id = []
var past = connection.query('SELECT * FROM tweet WHERE tweet_text LIKE "%' + req.body.player + '%" ORDER BY created_at DESC', req.body.player, function(error, results, fields) {
    if (error) {
        throw error;
    } else {
        res.render('index', {
            query: query,
            player: player,
            team: team,
            DBtweets: results
        });

    }
});
}
}

function getRecAndRender(tweets, player, team, query, req, res, classifiedTweets) {
if (team !== '') {
var id = []
var check = connection.query('SELECT DISTINCT player_name,team FROM query WHERE player_name LIKE "%' + player + '%" AND team LIKE "%' + team + '%" ORDER BY created_at DESC LIMIT 3;', [
    player, team
], function(error, results, fields) {
    if (error) {
        throw error;
    } else {
        console.log(results)
        res.render('index', {
            query: query,
            player: player,
            team: team,
            tweets: tweets,
            classifiedTweets: classifiedTweets,
            recommendations: results,
            moment: moment
        });
    }
});
} else {
var id = []
var past = connection.query('SELECT DISTINCT player_name,team FROM query WHERE player_name LIKE "%' + req.body.player + '%" ORDER BY created_at DESC LIMIT 3;', req.body.player, function(error, results, fields) {
    if (error) {
        throw error;
    } else {

        res.render('index', {
            query: query,
            player: player,
            team: team,
            tweets: tweets,
            classifiedTweets: classifiedTweets,
            recommendations: results,
            moment: moment
        });
    }
});
}
}

function findUniqueDates(tweets) {
// return the dates that tweets were created
var array = tweets.map(function(tweet) {
return new Date(tweet.created_at)
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
dates.forEach(function(date) {
var tempArray = tweets.filter(function(tweet) {
    return (new Date(tweet.created_at).getDate() == date);
});
array.push(tempArray);
});
return array;
}
/*
function splitQuery(queryString) {
  var words = queryString.split(" ");
  var fullQuery = ""

  for (word = 0; word < words.length; word++){
    if (word == words.length - 1){
      fullQuery = fullQuery + words[word]
    }
    else{
      fullQuery = fullQuery + words[word] + " OR "
    }
  }
  return (fullQuery)
 }
 */
