var StringUtils = require('./string_utils.js');

var Game = function (players) {
  console.log('starting a new game...');
  this.words = ['omg', 'wtf', 'ebasi', 'gggg', 'prase'];
  var game = this;
  for (var i = 0; i < players.length; ++i) {
    players[i].score = 0;

    (function () {
      var player = players[i];
      player.on('game_message', function (parts) {
        game.handlePlayerMessage(player, parts);
      });
    })();
  }
  this.players = players;
  this.start();
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
  var word = argsArray[1];
  var editDistance = StringUtils.editDistance(word, this.words[round]);
  var score = Math.max(0, this.words[round].length - editDistance);
  player.score += score;
  this.emitScores();
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
  player.isTyping = true;
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
    console.log(this.players[i].listeners('client_message'));
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
  }, Game.round_timeout * 1000);
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
Game.round_timeout = 5;

module.exports = Game;