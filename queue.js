var Game = require('./game.js');

var playerQueue = {
  players: [],
  gameSize: 3,
  addPlayer: function (player) {
    this.players.push(player);
    if (this.players.length == this.gameSize) {
      var game = new Game(this.players);
      this.players = [];
    }
  }
};

module.exports = playerQueue;
