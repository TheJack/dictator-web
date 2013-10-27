var StringUtils = require('./string_utils.js');
var request = require('request');

var Game = function (players) {
  console.log('starting a new game...');
  var game = this;
  for (var i = 0; i < players.length; ++i) {
    players[i].score = 0;
    players[i].hasAnswered = {};

    (function () {
      var player = players[i];
      player.on('game_message', function (parts) {
        game.handlePlayerMessage(player, parts);
      });
    })();
  }
  this.players = players;
  this.retrieveWords(function (err, words) {
    if (err) {
      words = Game.fallback_words.slice(0, Game.rounds);
    }
    game.words = words;
    game.start();
  });
};

Game.prototype.retrieveWords = function (cb) {
  request({
    url: 'http://localhost:3002/randomWords/' + Game.rounds,
    json: true
  }, function (err, res, body) {
    cb(err, body);
  });
};

Game.prototype.handlePlayerMessage = function (player, parts) {
  var command = parts.splice(0, 1)[0];
  switch (command) {
    case 'answer':
      this.handleAnswer(player, parts);
      break;
    case 'update_typing_state':
      this.updateTypingState(player, parts);
      break;
  }
};

Game.prototype.handleAnswer = function (player, argsArray) {
  var round = argsArray[0];
  var word = argsArray[1].toLowerCase();
  if (player.hasAnswered.hasOwnProperty(round)) {
    return;
  }
  player.hasAnswered[round] = true;
  var editDistance = StringUtils.editDistance(word, this.words[round]);
  var score = Math.max(0, this.words[round].length - editDistance);
  player.score += score;
  this.emitPlayerScore(player);
  this.emitScores();
};

Game.prototype.emitPlayerScore = function (player) {
  player.emit('client_message', 'your_score,' + player.score);
};

Game.prototype.emitScores = function () {
  var message = 'update_scores';
  for (var i = 0; i < this.players.length; ++i) {
    message += ',';
    message += this.players[i].score;
  }
  this.emit(message);
};

Game.prototype.updateTypingState = function (player, argsArray) {
  player.isTyping = Number(argsArray[0]);
  this.emitTypingStates();
};

Game.prototype.emitTypingStates = function () {
  var message = 'update_typing_state';
  for (var i = 0; i < this.players.length; ++i) {
    message += ',';
    message += this.players[i].isTyping ? 1 : 0;
  }
  this.emit(message);
};

Game.prototype.resetTypingStates = function () {
  for (var i = 0; i < this.players.length; ++i) {
    this.players[i].isTyping = false;
  }
};

Game.prototype.emit = function (message) {
  for (var i = 0; i < this.players.length; ++i) {
    this.players[i].emit('client_message', message);
  }
};

Game.prototype.start = function () {
  var message = 'start,' + this.players.length;
  for (var i = 0; i < this.players.length; ++i) {
    message += ',';
    message += this.players[i].name;
  }
  this.emit(message);

  this.startRound(0);
};

Game.prototype.startRound = function (round) {
  this.resetTypingStates();
  var message = 'round,' + round + ',' + this.words[round] + ',' + Game.round_timeout;
  this.emit(message);
  var game = this;
  setTimeout(function () {
    if (round + 1 < Game.rounds) {
      game.startRound(round + 1);
    } else {
      game.end();
    }
  }, (Game.round_timeout + 1) * 1000);
};

Game.prototype.end = function () {
  var message = 'end';
  for (var i = 0; i < this.players.length; ++i) {
    message += ',';
    message += this.players[i].score;
  }
  this.emit(message);
};

Game.rounds = 5;
Game.round_timeout = 10;
Game.fallback_words = ['word', 'temporary', 'singular',
  'command', 'type', 'console', 'computer', 'water',
  'tangent', 'road', 'house', 'relative', 'comparison'];

module.exports = Game;
