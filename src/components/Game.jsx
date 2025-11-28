import { useState, useEffect, useRef } from 'react';
import './Game.css';

const GRID_SIZE = 20;
const CELL_SIZE = 25;
const CANVAS_SIZE = GRID_SIZE * CELL_SIZE;
const INITIAL_SNAKE = [
  { x: 10, y: 10 },
  { x: 9, y: 10 },
  { x: 8, y: 10 }
];
const INITIAL_DIRECTION = { x: 1, y: 0 };
const GAME_SPEED = 150;

const Game = () => {
  const canvasRef = useRef(null);
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [food, setFood] = useState({ x: 15, y: 15 });
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  const directionQueueRef = useRef([]);

  // Generate random food position
  const generateFood = (currentSnake) => {
    let newFood;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      };
    } while (currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y));
    return newFood;
  };

  // Check collision with walls or self
  const checkCollision = (head, snakeBody) => {
    // Wall collision
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
      return true;
    }
    // Self collision
    return snakeBody.some(segment => segment.x === head.x && segment.y === head.y);
  };

  // Game loop
  useEffect(() => {
    if (!gameStarted || isPaused || gameOver) return;

    const gameInterval = setInterval(() => {
      setSnake(prevSnake => {
        // Get direction from queue or use current direction
        const currentDirection = directionQueueRef.current.length > 0 
          ? directionQueueRef.current.shift() 
          : direction;

        const newHead = {
          x: prevSnake[0].x + currentDirection.x,
          y: prevSnake[0].y + currentDirection.y
        };

        // Check collision
        if (checkCollision(newHead, prevSnake)) {
          setGameOver(true);
          return prevSnake;
        }

        const newSnake = [newHead, ...prevSnake];

        // Check if food eaten
        if (newHead.x === food.x && newHead.y === food.y) {
          setScore(prev => prev + 10);
          setFood(generateFood(newSnake));
        } else {
          newSnake.pop(); // Remove tail if no food eaten
        }

        return newSnake;
      });
    }, GAME_SPEED);

    return () => clearInterval(gameInterval);
  }, [gameStarted, isPaused, gameOver, direction, food]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === ' ') {
        e.preventDefault();
        if (gameStarted && !gameOver) {
          setIsPaused(prev => !prev);
        }
        return;
      }

      if (gameOver || isPaused) return;

      const keyMap = {
        'ArrowUp': { x: 0, y: -1 },
        'ArrowDown': { x: 0, y: 1 },
        'ArrowLeft': { x: -1, y: 0 },
        'ArrowRight': { x: 1, y: 0 }
      };

      const newDirection = keyMap[e.key];
      if (newDirection) {
        e.preventDefault();
        
        // Get the last direction in queue or current direction
        const lastDirection = directionQueueRef.current.length > 0
          ? directionQueueRef.current[directionQueueRef.current.length - 1]
          : direction;

        // Prevent reversing direction
        if (newDirection.x !== -lastDirection.x || newDirection.y !== -lastDirection.y) {
          if (directionQueueRef.current.length < 2) {
            directionQueueRef.current.push(newDirection);
            setDirection(newDirection);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [direction, gameOver, isPaused, gameStarted]);

  // Draw game on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Draw grid
    ctx.strokeStyle = '#16213e';
    ctx.lineWidth = 1;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL_SIZE, 0);
      ctx.lineTo(i * CELL_SIZE, CANVAS_SIZE);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(0, i * CELL_SIZE);
      ctx.lineTo(CANVAS_SIZE, i * CELL_SIZE);
      ctx.stroke();
    }

    // Draw snake
    snake.forEach((segment, index) => {
      ctx.fillStyle = index === 0 ? '#4ecca3' : '#45b393';
      ctx.fillRect(
        segment.x * CELL_SIZE + 1,
        segment.y * CELL_SIZE + 1,
        CELL_SIZE - 2,
        CELL_SIZE - 2
      );
      
      // Snake head eyes
      if (index === 0) {
        ctx.fillStyle = '#1a1a2e';
        const eyeSize = 3;
        if (direction.x === 1) { // Right
          ctx.fillRect(segment.x * CELL_SIZE + CELL_SIZE - 8, segment.y * CELL_SIZE + 6, eyeSize, eyeSize);
          ctx.fillRect(segment.x * CELL_SIZE + CELL_SIZE - 8, segment.y * CELL_SIZE + CELL_SIZE - 9, eyeSize, eyeSize);
        } else if (direction.x === -1) { // Left
          ctx.fillRect(segment.x * CELL_SIZE + 5, segment.y * CELL_SIZE + 6, eyeSize, eyeSize);
          ctx.fillRect(segment.x * CELL_SIZE + 5, segment.y * CELL_SIZE + CELL_SIZE - 9, eyeSize, eyeSize);
        } else if (direction.y === -1) { // Up
          ctx.fillRect(segment.x * CELL_SIZE + 6, segment.y * CELL_SIZE + 5, eyeSize, eyeSize);
          ctx.fillRect(segment.x * CELL_SIZE + CELL_SIZE - 9, segment.y * CELL_SIZE + 5, eyeSize, eyeSize);
        } else { // Down
          ctx.fillRect(segment.x * CELL_SIZE + 6, segment.y * CELL_SIZE + CELL_SIZE - 8, eyeSize, eyeSize);
          ctx.fillRect(segment.x * CELL_SIZE + CELL_SIZE - 9, segment.y * CELL_SIZE + CELL_SIZE - 8, eyeSize, eyeSize);
        }
      }
    });

    // Draw food
    ctx.fillStyle = '#ff6b6b';
    ctx.beginPath();
    ctx.arc(
      food.x * CELL_SIZE + CELL_SIZE / 2,
      food.y * CELL_SIZE + CELL_SIZE / 2,
      CELL_SIZE / 2 - 3,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }, [snake, food, direction]);

  const startGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setFood(generateFood(INITIAL_SNAKE));
    setScore(0);
    setGameOver(false);
    setIsPaused(false);
    setGameStarted(true);
    directionQueueRef.current = [];
  };

  const restartGame = () => {
    startGame();
  };

  return (
    <div className="game-container">
      <div className="game-info">
        <h1>Snake Game</h1>
        <div className="score">Score: {score}</div>
      </div>
      
      <div className="canvas-wrapper">
        <canvas
          ref={canvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          className="game-canvas"
        />
        
        {!gameStarted && (
          <div className="overlay">
            <h2>Welcome to Snake!</h2>
            <p>Use arrow keys to move</p>
            <p>Press Space to pause</p>
            <button onClick={startGame} className="btn btn-start">Start Game</button>
          </div>
        )}
        
        {isPaused && gameStarted && !gameOver && (
          <div className="overlay">
            <h2>Paused</h2>
            <button onClick={() => setIsPaused(false)} className="btn btn-resume">Resume</button>
          </div>
        )}
        
        {gameOver && (
          <div className="overlay">
            <h2>Game Over!</h2>
            <p>Final Score: {score}</p>
            <button onClick={restartGame} className="btn btn-restart">Play Again</button>
          </div>
        )}
      </div>
      
      <div className="controls-info">
        <p>🎮 Arrow Keys: Move | Space: Pause</p>
      </div>
    </div>
  );
};

export default Game;
