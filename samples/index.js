var nodejs_port = 7070;
var sync_port = 4984;
var address = '127.0.0.1';
//var request = require('request');

// server.js

// BASE SETUP
// =============================================================================

// call the packages we need
var express    = require('express');        // call express
var app        = express();                 // define our app using express
var bodyParser = require('body-parser');

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var port = process.env.PORT || nodejs_port;        // set our port

// ROUTES FOR OUR API
// =============================================================================
var router = express.Router();              // get an instance of the express Router

// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
router.get('/', function(req, res) {
    res.json({ message: 'hooray! welcome to our api!' });
});

// more routes for our API will happen here

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/api', router);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);

//var express = require('express.io');
//app = express().http().io();
//
//// Setup your sessions, just like normal.
//app.use(express.cookieParser());
//app.use(express.session({secret: 'monkey'}));
//
//// Session is automatically setup on initial request.
//app.get('/', function(req, res) {
//    req.session.loginDate = new Date().toString();
//    res.sendfile(__dirname + '/client.html')
//});
//
//app.post('/application/registration', function(req, res){
//
//    //forward to a registration route
//    req.io.route('registration');
//});
//
//app.io.route('registration', function(req) {
//    //do somthing with data
//
//    //respond
//    req.io.respond({hello: 'from io route'})
//});
//
//// Setup a route for the ready event, and add session data.
//app.io.route('ready', function(req) {
//    req.session.name = req.data;
//    req.session.save(function() {
//        req.io.emit('get-feelings')
//    })
//});
//
//// Send back the session data.
//app.io.route('send-feelings', function(req) {
//    req.session.feelings = req.data;
//    req.session.save(function() {
//        req.io.emit('session', req.session)
//    })
//});
//
//app.listen(nodejs_port);

//http.createServer(function (req, res) {
//
//    //get the request path and parameters
//
//
//    // make request to local sync gateway
//    request('http://' + address + ':' + sync_port , function (error, response, body) {
//        if (!error && response.statusCode == 200) {
//            console.log(body);
//
//            res.writeHead(200, {'Content-Type': 'text/plain'});
//            res.end('Hello World: '+body+'\n');
//        }
//    });
//
//
//}).listen(nodejs_port, address);

console.log('Server running at http://' + address + ':' + nodejs_port + '/');