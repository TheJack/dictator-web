var EventEmitter = require('events').EventEmitter;
var queue = require('./queue.js');
var util = require('util');

var Player = function () {
  EventEmitter.call(this);
  this.name = 'Guest';
  this.game = null;
};
util.inherits(Player, EventEmitter);

Player.prototype.handleMessage = function (message) {
  console.log('received message ' + message);
  var parts = message.split(',');
  var command = parts[0];
  switch (command) {
    case 'set_name':
      console.log('switch: setting name to ' + parts[1]);
      this.name = parts[1];
      break;
    case 'play':
      console.log('switch: handling play');
      queue.addPlayer(this);
      break;
    default:
      console.log('switch: emitting game_message');
      this.emit('game_message', parts);
      break;
  }
};

module.exports = Player;
