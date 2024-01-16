// Import bibliotek i komponentów React
import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

// Utworzenie instancji socket.io i połączenie z serwerem na porcie 3000.
const socket = io('http://192.168.50.108:3000');

// Komponent główny aplikacji React
function App() {
  //Stan komponentu
  const [board, setBoard] = useState(Array(9).fill(null));
  const [status, setStatus] = useState('Click "Find Player" to start');
  const [gameOverMessage, setGameOverMessage] = useState(null);
  const [playerSymbol, setPlayerSymbol] = useState(null);
  const [gameId, setGameId] = useState(null);
  const [gameActive, setGameActive] = useState(false);
  const [showFindPlayerButton, setShowFindPlayerButton] = useState(true); // Dodaj nowy stan
  const [showPlayAgainButton, setShowPlayAgainButton] = useState(false);

 // Efekt uboczny do obsługi zdarzeń socket.io
  useEffect(() => {
// Obsługa zdarzenia rozpoczęcia gry
    socket.on('gameStart', (symbol, gameId) => {
      setStatus('Game started!');
      setPlayerSymbol(symbol);
      setGameId(gameId);
      setGameActive(true);
      setShowFindPlayerButton(false); // Ukryj przycisk po rozpoczęciu gry
      setShowPlayAgainButton(false); // Ukryj przycisk "Play Again" po rozpoczęciu gry
    });

  // Obsługa zdarzenia ruchu gracza
    socket.on('yourTurn', (newBoard) => {
      setBoard(newBoard);
      setStatus('Your turn!');
      console.log("New Board:", newBoard);
    });

 // Obsługa zdarzenia ruchu przeciwnika
    socket.on('opponentTurn', (newBoard) => {
      setBoard(newBoard);
      setStatus('Opponent\'s turn...');
      console.log("New Board:", newBoard);
    });

// Obsługa zdarzenia zakończenia gry
    socket.on('gameOver', (message) => {
      setGameOverMessage(message);
      setStatus('Game Over');
      setGameActive(false);
      setShowPlayAgainButton(true); // Pokaż przycisk "Play Again" po zakończeniu gry
    });

 // Obsługa zdarzenia nieprawidłowego ruchu
    socket.on('invalidMove', () => {
      setStatus('Invalid move! Try again.');
    });

 // Obsługa zdarzenia rozłączenia przeciwnika
    socket.on('opponentDisconnected', () => {
      setGameOverMessage('The opponent has disconnected!');
      setStatus('Game Over');
      setShowFindPlayerButton(true); // Pokaż przycisk po rozłączeniu przeciwnika
    });

 // Funkcja czyszcząca subskrypcje zdarzeń przy odmontowywaniu komponentu
    return () => {
      socket.off('gameStart');
      socket.off('yourTurn');
      socket.off('opponentTurn');
      socket.off('gameOver');
      socket.off('invalidMove');
      socket.off('opponentDisconnected'); // Usuwanie obsługi zdarzenia rozłączenia
    };
  }, []);  // Pusta tablica zależności oznacza, że efekt jest uruchamiany tylko raz po zamontowaniu komponentu

  // Funkcja do wyszukiwania gracza
  const findPlayer = () => {
  // Logika resetowania gry, gdy jest aktywna
    if (gameActive) {
      setBoard(Array(9).fill(null));
      setStatus('Click "Find Player" to start');
      setGameOverMessage(null);
      setPlayerSymbol(null);
      setGameId(null);
      setGameActive(false);
    }
  // Wysłanie żądania do serwera o znalezienie gracza
    socket.emit('findPlayer');
    setStatus('Finding player...');
  };
  
  // Obsługa kliknięcia w komórkę planszy
  const handleCellClick = (position) => {
  // Sprawdzenie stanu gry i obsługa różnych przypadków
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
  // Wysłanie ruchu gracza do serwera
    socket.emit('makeMove', gameId, position);
  };

  // Funkcja obsługująca przycisk "Play Again"
  const playAgain = () => {
    setShowPlayAgainButton(false);   // Ukryj przycisk "Play Again"
    setShowFindPlayerButton(true);   // Pokaż przycisk "Find Player"
    resetGameStates();
  };
  // Funkcja resetująca stany gry
  const resetGameStates = () => {
    setBoard(Array(9).fill(null));
    setStatus('Click "Find Player" to start');
    setGameOverMessage(null);
    setPlayerSymbol(null);
    setGameId(null);
    setGameActive(false);
  };
 
  // Funkcja renderująca pojedynczą komórkę planszy
  const renderCell = (position) => {
    return (
      <div className="cell" onClick={() => handleCellClick(position)}>
        {board[position]}
      </div>
    );
  };

   // Zwrócenie struktury komponentu
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
  // Eksport komponentu 
export default App;