var express = require('express');
var router = express.Router();
var connection = require('../config/database');

router.get('/api/tweet', function(req, res, next)  {
    res.json({message: 'Hi there'});
    // res.send('respond with a resource');
});


module.exports = router;




  // router.get('/api/tweet/:query/online', function(req, res, next) {
  //   T.get('search/tweets', { // query twitter rest api
  //       q: req.param.query,
  //       count: 100,
  //       exclude: 'retweets',
  //       lang: 'en'
  //   }, function(err, data, response) {
  //     res.json({
  //       query: query,
  //       player: player,
  //       team: team,
  //       author: author
  //     });
  //   });
  // });
