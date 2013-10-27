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
  ws.on('close', function () {
    console.log('WebSocket connection closed.');
    p.removeAllListeners('client_message');
    playerQueue.removePlayer(p);
  });
  ws.on('message', function (message) {
    p.handleMessage(message);
  });
  p.on('client_message', function handleWsClientMessage(message) {
    console.log('sending message ' + message);
    try {
      ws.send(message);
    } catch (e) {
      console.log(e);
    }
  });
});

var net = require('net');

var netServer = net.createServer(function (con) {
  con.on('error', function (err) {
    console.error(err);
    p.removeAllListeners('client_message');
    playerQueue.removePlayer(p);
  });
  con.on('close', function () {
    p.removeAllListeners('client_message');
    playerQueue.removePlayer(p);
  });
  var p = new Player();
  con.on('message', function (message) {
    p.handleMessage(message);
  });
  p.on('client_message', function handleTcpClientMessage(message) {
    console.log('writing message ' + message + ' from ' + con.remoteAddress);
    message += '\n';
    var res = con.write(message, function () {
      console.log('wrote data to TCP socket');
    });
    console.log('result from calling con.write: ' + res);
  });
  
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
