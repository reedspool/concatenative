
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var concatinative = require('./routes/concatinative');
var user = require('./routes/user');
var http = require('http');
var path = require('path');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
// Before we were thinking about parsing the body immediately,
// app.use(express.bodyParser());
// app.use(express.methodOverride());
// But now we want it "raw"; parsing comes later
app.use(function(req, res, next) {
    var data='';
    req.setEncoding('utf8');
    req.on('data', function(chunk) { 
       data += chunk;
    });

    req.on('end', function() {
        req.body = data;
        next();
    });
});
app.use(express.cookieParser('your secret here'));
app.use(express.session());
app.use(app.router);
app.use(require('stylus').middleware(__dirname + '/public'));
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/exec/*', concatinative.exec);
app.post('/exec/*', concatinative.exec);
app.get('/json/*', concatinative.json);
app.post('/json/*', concatinative.json);

app.get('/', routes.index);
// app.get('/syntax/*', routes.syntax);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
