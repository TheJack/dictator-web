var queue = require('./queue.js');

var Player = function () {
  this.name = 'Guest';
  this.game = null;
};

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
    case 'answer':
      console.warn('HANDLE answer!');
      break;
  }
};

module.exports = Player;
