var express = require('express');
var http = require('http');
var playerQueue = require('./queue.js');
var Player = require('./player.js');
var WebSocketServer = require('ws').Server;


var app = express();
app.use(express.static(__dirname + '/static'));

var server = http.createServer(app);
server.listen(3000, '0.0.0.0');

var wss = new WebSocketServer({server: server});
wss.on('connection', function (ws) {
  var p = new Player();
  ws.on('message', function (message) {
    p.handleMessage(message);
  });
  p.on('client_message', function handleWsClientMessage(message) {
    ws.send(message);
  });
  console.log(p.listeners('client_message'));
});

var net = require('net');

var netServer = net.createServer(function (con) {
  var p = new Player();
  con.on('message', function (message) {
    p.handleMessage();
  });
  p.on('client_message', function handleTcpClientMessage(message) {
    console.log('writing message ' + message + ' from ' + con.remoteAddress);
    con.write(message);
  });
  console.log(p.listeners('client_message'));
  
  console.log('connection from')
  var buffer = '';
  con.on('data', function (data) {
    console.log('data event ' + data);
    buffer += data.toString();
    handleAppend();
  });

  var handleAppend = function () {
    var newlinePos = buffer.indexOf('\n');
    if (newlinePos == -1) {
      return;
    }
    con.emit('message', buffer.substr(0, newlinePos));
    buffer = buffer.substr(newlinePos + 1);
    process.nextTick(handleAppend);
  }
});

netServer.listen(3001, function () {
  console.log('listening for TCP connections...');
});
