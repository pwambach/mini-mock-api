var API = require('../lib/mini-mock-api');
var cookieParser = require('cookie-parser');

//session data
var sessionCookie = 'SESSION'
var sessionTimeout = 60*60*1000; // 1 hour
var username = 'test';
var password = 'test';

var server = new API({
  basePath: '/api/v1',
  port: 8080,
  mockPath: 'mock-files',
  idAttribute: '_id'
});
server.app.use(cookieParser());

//Login with /login?username=test&password=test
server.getFromRoot('/login', function (request, response) {
  if(request.query.username === username && request.query.password === password){
    response.cookie(sessionCookie, 'token', {expires: new Date(Date.now() + sessionTimeout)});
    response.status(200);
    response.json({status: 'successful'});
  } else {
    response.sendStatus(401);
  }
});

//Logout with /logout
server.getFromRoot('/logout', function (request, response) {
  response.clearCookie(sessionCookie);
  response.status(200);
  response.json({status: 'successful'});
});

//Ping /ping
server.getFromRoot('/ping', function (request, response) {
  if(request.cookies[sessionCookie]){
    response.cookie(sessionCookie, 'token', {expires: new Date(Date.now() + sessionTimeout)});
    response.json({user: username});
  } else {
    response.json({user: null});
  }
});

server.start();
