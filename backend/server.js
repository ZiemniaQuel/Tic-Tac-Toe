// Library imports
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

// Creating an instance of the Express application and an HTTP server
const app = express();
const server = http.createServer(app);

// Create a socket.io instance with CORS settings
const io = new Server(server, {
  cors: {
    origin: 'http://192.168.244.8:5173', // Update this with the frontend URL.
    methods: ['GET', 'POST'],
  },
});

// Using middleware cors for Express applications
app.use(cors());

// Variables storing game states
let waitingPlayer = null;   // Keep track of player who is waiting for an opponent.
const games = {};           // Store all active games.

/**
 * Creates a new game instance.
 * 
 * @param {string} player1 - ID of the first player.
 * @param {string} player2 - ID of the second player.
 * @returns {string} - Returns a unique gameId.
 */
const createNewGame = (player1, player2) => {
  const gameId = `${player1}-${player2}`;
  games[gameId] = {
    board: Array(9).fill(null),
    currentPlayer: player1,
    player1,
    player2,
  };
  return gameId;
};

/**
 * Handles player's move.
 * 
 * @param {string} gameId - ID of the current game.
 * @param {string} player - Player making the move.
 * @param {number} position - Position of the move on the board.
 * @returns {boolean} - Returns whether the move was successful.
 */
const makeMove = (gameId, player, position) => {
  const game = games[gameId];
  if (!game || game.board[position] || game.currentPlayer !== player) {
    return false;
  }
  game.board[position] = player === game.player1 ? 'X' : 'O';
  game.currentPlayer = game.currentPlayer === game.player1 ? game.player2 : game.player1;
  return true;
};

/**
 * Checks if there's a winning combination on the board.
 * 
 * @param {Array} board - Current game board.
 * @returns {boolean} - Returns true if there's a win.
 */
const checkWin = (board) => {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return true;
    }
  }
  return false;
};

/**
 * Checks if the game is a draw.
 * 
 * @param {Array} board - Current game board.
 * @returns {boolean} - Returns true if the game is a draw.
 */
const checkDraw = (board) => {
  return board.every(cell => cell !== null);
};
///////////////////////////////////////////////////////////////////////////////////////////////////
/**
 * Closes a game and removes it from the active games list.
 * 
 * @param {string} gameId - ID of the game to close.
 */
const closeGame = (gameId) => {
  if (games[gameId]) {
    delete games[gameId];
  }
};
//////////////////////////////////////////////////////////////////////////////////////////////////
// Socket.io connection logic.
io.on('connection', (socket) => {
  console.log('a user connected', socket.id);

  // Handle request to find a player for a game.
  socket.on('findPlayer', () => {
    if (waitingPlayer && waitingPlayer !== socket.id) {
      // If there's a waiting player, start the game.
      const gameId = createNewGame(waitingPlayer, socket.id);
      io.to(waitingPlayer).emit('gameStart', 'X', gameId);
      socket.emit('gameStart', 'O', gameId);
      waitingPlayer = null;
      console.log('game started');
    } else {
      // If there isn't a waiting player, set this player as waiting.
      waitingPlayer = socket.id;
      console.log('first player ready');
    }
  });

 // Handle player move.
socket.on('makeMove', (gameId, position) => {
  console.log('makeMove', gameId, position);
  const player = socket.id;
  const success = makeMove(gameId, player, position);
  // Check game status and send relevant updates.
  if (success) {
    const game = games[gameId];
    const hasWon = checkWin(game.board);
    const draw = !hasWon && checkDraw(game.board);
    const secondPlayer = player === game.player1 ? game.player2 : game.player1;

    io.to(secondPlayer).emit('yourTurn', game.board);
    io.to(player).emit('opponentTurn', game.board);
    
    if (hasWon) {
      socket.emit('gameOver', 'You win!');
      io.to(secondPlayer).emit('gameOver', 'You lose!');
      // Close the game after notifying players about the result.
      closeGame(gameId);
    } else if (draw) {
      io.to(player).emit('gameOver', 'It\'s a draw!');
      io.to(secondPlayer).emit('gameOver', 'It\'s a draw!');
      // Close the game after notifying players about the draw.
      closeGame(gameId);
    }
  } else {
    socket.emit('invalidMove');
  }
});

  // Handle player disconnect.
  socket.on('disconnect', () => {
    console.log('user disconnected', socket.id);
    if (waitingPlayer === socket.id) {
      waitingPlayer = null;
    }

    // Check if the disconnected player was in an active game.
    for (const gameId in games) {
      if (games[gameId].player1 === socket.id || games[gameId].player2 === socket.id) {
        // Notify the other player that their opponent has disconnected.
        const otherPlayer = games[gameId].player1 === socket.id ? games[gameId].player2 : games[gameId].player1;
        io.to(otherPlayer).emit('opponentDisconnected');
        // Close the game.
        closeGame(gameId);
        console.log('Game closed due to player disconnect');
      }
    }
  });
});

// Start the server.
server.listen(3000, () => {
  console.log('listening on *:3000');
});