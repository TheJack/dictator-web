var express = require('express');
var http = require('http');
var playerQueue = require('./queue.js');
var Player = require('./player.js');
var request = require('request');
var WebSocketServer = require('ws').Server;


var app = express();
app.use(express.static(__dirname + '/static'));

var wrongWords = {};

app.get('/wrongWord/:word', function (req, res) {
  var word = req.param('word');
  if (!wrongWords.hasOwnProperty(word)) {
    wrongWords[word] = 0;
  }
  ++wrongWords[word];
  console.log('word ' + word + ' mistaken ' + wrongWords[word] + ' times.');
  res.json({ok: true});
});

var getWrongCount = function (word) {
  var res = 1;
  if (wrongWords.hasOwnProperty(word)) {
    res = wrongWords[word];
  }
  return res;
};

app.get('/mistakes', function (req, res) {
  var words = Object.keys(wrongWords);
//  words = ['and', 'play', 'consequence'];
  console.log(words);
  request({url: 'http://localhost:3002/wordCounts', method: 'POST', json: {words: words}},
    function (err, _, body) {
      words.sort(function (w1, w2) {
        console.log(w1);
        console.log(w2);
        return -(body[w1] * getWrongCount(w1) - body[w2] * getWrongCount(w2));
      });
      console.log(body);
      res.json(words);
    });
});

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
