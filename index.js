var express = require('express');
var http = require('http');
var WebSocketServer = require('ws').Server;

var app = express();
app.use(express.static(__dirname + '/static'));

var server = http.createServer(app);
server.listen(3000, '0.0.0.0');

var wss = new WebSocketServer({server: server});
wss.on('connection', function (ws) {
  ws.on('message', function dispatch() {
    
  });
});
