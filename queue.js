var Game = require('./game.js');

var playerQueue = {
  players: [],
  gameSize: 3,
  addPlayer: function (player) {
    this.players.push(player);
    console.log('There are ' + this.players.length + ' players in the queue.');
    if (this.players.length == this.gameSize) {
      var game = new Game(this.players);
      this.players = [];
    }
  },
  removePlayer: function (player) {
    var index = this.players.indexOf(player);
    if (index != -1) {
      console.log('Removed player ' + player.name + ' from queue.');
      this.players.splice(index, 1);
    }
  }
};

module.exports = playerQueue;
