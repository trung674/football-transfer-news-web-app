var express = require('express');
var app = express();
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mysql = require("mysql");
var hbs = require('hbs');

var index = require('./routes/index');
var users = require('./routes/users');



var server = require('http').Server(app);
var io = require('socket.io')(server)


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
hbs.registerHelper('formatDate', function(object) {
  var d = new Date(object);
  var hour = d.getHours();
  var minute = (d.getMinutes() < 10?'0':'') + d.getMinutes();
  var d_str = hour + ':' + minute + ' ' + d.toDateString();
  return d_str;
});

hbs.registerHelper('formatArray', function(object) {
  var str = "<ul>";
  object.forEach(function(array) {
    var date = new Date(array[0].created_at).toDateString();
    var length = array.length;
      str = str + "<li><b>" + date + "</b>: " + length + " " + (length == 1? "tweet": "tweets") +"</li>"
  });
  return str + "</ul>";
});
// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'public', 'images', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(require('node-sass-middleware')({
  src: path.join(__dirname, 'public'),
  dest: path.join(__dirname, 'public'),
  indentedSyntax: true,
  sourceMap: true
}));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

io.on('connection', function(socket){
  console.log('a user connected');
});

module.exports = app;
