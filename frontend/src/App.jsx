// Import React libraries and resources
import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

// Create a socket.io instance and connect to the server on port 3000.
const socket = io('http://192.168.244.8:3000');

// The main component of a React application
function App() {
  //Component status
  const [board, setBoard] = useState(Array(9).fill(null));
  const [status, setStatus] = useState('Click "Find Player" to start');
  const [gameOverMessage, setGameOverMessage] = useState(null);
  const [playerSymbol, setPlayerSymbol] = useState(null);
  const [gameId, setGameId] = useState(null);
  const [gameActive, setGameActive] = useState(false);
  const [showFindPlayerButton, setShowFindPlayerButton] = useState(true); // Dodaj nowy stan
  const [showPlayAgainButton, setShowPlayAgainButton] = useState(false);

 // Side effect for socket.io event handling
  useEffect(() => {
// Game start event handling
    socket.on('gameStart', (symbol, gameId) => {
      setStatus('Game started!');
      setPlayerSymbol(symbol);
      setGameId(gameId);
      setGameActive(true);
      setShowFindPlayerButton(false); // Hide the button after starting the game
      setShowPlayAgainButton(false); // Hide the "Play Again" button after starting the game
    });

  // Player movement event handling
    socket.on('yourTurn', (newBoard) => {
      setBoard(newBoard);
      setStatus('Your turn!');
      console.log("New Board:", newBoard);
    });

 // Handling the opponent's movement event
    socket.on('opponentTurn', (newBoard) => {
      setBoard(newBoard);
      setStatus('Opponent\'s turn...');
      console.log("New Board:", newBoard);
    });

// Game over event handling
    socket.on('gameOver', (message) => {
      setGameOverMessage(message);
      setStatus('Game Over');
      setGameActive(false);
      setShowPlayAgainButton(true); // Show the "Play Again" button after the game is finished
    });

 // Invalid traffic event handling
    socket.on('invalidMove', () => {
      setStatus('Invalid move! Try again.');
    });

 // Handling the adversary disconnection event
    socket.on('opponentDisconnected', () => {
      setGameOverMessage('The opponent has disconnected!');
      setStatus('Game Over');
      setShowFindPlayerButton(true); // Pokaż przycisk po rozłączeniu przeciwnika
    });

 // A function that clears event subscriptions when unmounting a component
    return () => {
      socket.off('gameStart');
      socket.off('yourTurn');
      socket.off('opponentTurn');
      socket.off('gameOver');
      socket.off('invalidMove');
      socket.off('opponentDisconnected'); // Remove the disconnection event handler
    };
  }, []);  // An empty dependency array means that the effect runs only once when the component is mounted

  // Player search function
  const findPlayer = () => {
  // Game reset logic when active
    if (gameActive) {
      setBoard(Array(9).fill(null));
      setStatus('Click "Find Player" to start');
      setGameOverMessage(null);
      setPlayerSymbol(null);
      setGameId(null);
      setGameActive(false);
    }
  // Sending a request to the server to find a player
    socket.emit('findPlayer');
    setStatus('Finding player...');
  };
  
  // Support for clicking on a board cell
  const handleCellClick = (position) => {
  // Checking the game status and handling various cases
    if (gameOverMessage)
    {
      setStatus('The game is over!');
      return;
    }
    else if (!gameId)
    {
      setStatus('You must find a player first!');
      return;
    }
    else if (board[position])
    {
      setStatus('There is already a piece there!');
      return;
    }
  // Sending the player's traffic to the server
    socket.emit('makeMove', gameId, position);
  };

  // Function supporting the "Play Again" button
  const playAgain = () => {
    setShowPlayAgainButton(false);   // Hide "Play Again" button
    setShowFindPlayerButton(true);   // Show "Find Player" button
    resetGameStates();
  };
  // Function that resets game states
  const resetGameStates = () => {
    setBoard(Array(9).fill(null));
    setStatus('Click "Find Player" to start');
    setGameOverMessage(null);
    setPlayerSymbol(null);
    setGameId(null);
    setGameActive(false);
  };
 
  // A function that renders a single cell of the board
  const renderCell = (position) => {
    return (
      <div className="cell" onClick={() => handleCellClick(position)}>
        {board[position]}
      </div>
    );
  };

   // Returning the component structure
  return (
    <div className="tic-tac-toe">
      <h1>Tic Tac Toe</h1>
      {showFindPlayerButton && <button onClick={findPlayer}>Find Player</button>}
      {showPlayAgainButton && <button onClick={playAgain}>Play Again</button>}
      <div className="status">{status}</div>
      {playerSymbol && <div className="symbol">Your symbol: {playerSymbol}</div>}
      <div className="board">
        {renderCell(0)}{renderCell(1)}{renderCell(2)}
        {renderCell(3)}{renderCell(4)}{renderCell(5)}
        {renderCell(6)}{renderCell(7)}{renderCell(8)}
      </div>
      {gameOverMessage && <div className="game-over">{gameOverMessage}</div>}
    </div>
  );
}
  // Component export
export default App;