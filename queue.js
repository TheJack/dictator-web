var Game = require('./game.js');

var playerQueue = {
  players: [],
  gameSize: 1,
  addPlayer: function (player) {
    console.log('player listeners: ');
    console.log(player.listeners('client_message'));
    this.players.push(player);
    console.log('player in queue listeners: ');
    console.log(this.players[this.players.length - 1].listeners('client_message'));
    console.log('There are ' + this.players.length + ' players in the queue.');
    if (this.players.length == this.gameSize) {
      var game = new Game(this.players);
      this.players = [];
    }
  }
};

module.exports = playerQueue;
