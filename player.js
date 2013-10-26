var EventEmitter = require('events').EventEmitter;
var queue = require('./queue.js');

var Player = function () {
  this.name = 'Guest';
  this.game = null;
};
Player.prototype.__proto__ = EventEmitter.prototype;

Player.prototype.handleMessage = function (message) {
  console.log('received message ' + message);
  var parts = message.split(',');
  var command = parts[0];
  switch (command) {
    case 'set_name':
      this.name = parts[1];
      break;
    case 'play':
      queue.addPlayer(this);
      break;
    default:
      this.emit('game_message', parts);
      break;
  }
};

module.exports = Player;
