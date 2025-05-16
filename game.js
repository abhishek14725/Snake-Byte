document.addEventListener('DOMContentLoaded', () => {
    // Game variables
    const SNAKE_SIZE = 20;
    const BALL_SIZE = 15;
    const INITIAL_SNAKE_LENGTH = 3;
    const INITIAL_SPEED = 120; // ms
    const MIN_SPEED = 60; // Fastest speed the game will reach
    const SPEED_DECREASE_FACTOR = 2; // How much faster the game gets per ball
    const SWIPE_THRESHOLD = 30; // Minimum swipe distance to trigger direction change

    // Game elements
    const gameContainer = document.getElementById('game-container');
    const swipeArea = document.getElementById('swipe-area');
    const scoreElement = document.getElementById('score');
    const finalScoreElement = document.getElementById('final-score');
    const gameOverElement = document.getElementById('game-over');
    const pauseOverlay = document.getElementById('pause-overlay');
    const startButton = document.getElementById('start-btn');
    const restartButton = document.getElementById('restart-btn');
    const resumeButton = document.getElementById('resume-btn');
    
    // Control buttons
    const directionButtons = document.querySelectorAll('.control-btn');
    const upButton = document.getElementById('up-btn');
    const downButton = document.getElementById('down-btn');
    const leftButton = document.getElementById('left-btn');
    const rightButton = document.getElementById('right-btn');
    
    // Dynamic game dimensions
    let GAME_WIDTH, GAME_HEIGHT;
    
    // Game state
    let snake = [];
    let direction = 'right';
    let nextDirection = 'right';
    let gameLoop = null;
    let ball = null;
    let score = 0;
    let gameStarted = false;
    let gamePaused = false;
    let gameSpeed = INITIAL_SPEED;
    let gridSize;
    let touchStartX = 0;
    let touchStartY = 0;
    let visibilityPaused = false;

    // Initialize game dimensions
    function updateGameDimensions() {
        // Get actual game container dimensions
        const rect = gameContainer.getBoundingClientRect();
        GAME_WIDTH = rect.width;
        GAME_HEIGHT = rect.height;
        
        // Calculate grid size based on game dimensions
        gridSize = Math.floor(Math.min(GAME_WIDTH, GAME_HEIGHT) / 25); // 25 cells across
        
        console.log(`Game dimensions: ${GAME_WIDTH}x${GAME_HEIGHT}, Grid size: ${gridSize}`);
    }

    // Initialize the game
    function initGame() {
        clearGameElements();
        updateGameDimensions();
        
        // Create initial snake in a safe starting position
        snake = [];
        let startX = Math.floor(GAME_WIDTH / 4);
        let startY = Math.floor(GAME_HEIGHT / 4);
        
        // Adjust to grid
        startX = Math.floor(startX / gridSize) * gridSize;
        startY = Math.floor(startY / gridSize) * gridSize;
        
        for (let i = 0; i < INITIAL_SNAKE_LENGTH; i++) {
            let snakePart = document.createElement('div');
            snakePart.className = i === 0 ? 'snake-part snake-head' : 'snake-part';
            snakePart.style.width = `${gridSize}px`;
            snakePart.style.height = `${gridSize}px`;
            snakePart.style.left = (startX - i * gridSize) + 'px';
            snakePart.style.top = startY + 'px';
            gameContainer.appendChild(snakePart);
            
            snake.push({
                element: snakePart,
                x: startX - i * gridSize,
                y: startY
            });
        }
        
        // Reset game variables
        direction = 'right';
        nextDirection = 'right';
        score = 0;
        gameSpeed = INITIAL_SPEED;
        updateScore();
        
        // Create first ball
        createBall();
        
        // Start game loop
        gamePaused = false;
        gameLoop = setInterval(updateGame, gameSpeed);
        gameStarted = true;
        
        // Update button text to "STOP GAME"
        startButton.textContent = "STOP GAME";
        startButton.classList.add('stop-btn');
    }
    
    // Pause game
    function pauseGame() {
        if (!gameStarted || gamePaused) return;
        
        clearInterval(gameLoop);
        gamePaused = true;
        pauseOverlay.classList.add('visible');
    }
    
    // Resume game
    function resumeGame() {
        if (!gameStarted || !gamePaused) return;
        
        pauseOverlay.classList.remove('visible');
        gameLoop = setInterval(updateGame, gameSpeed);
        gamePaused = false;
    }
    
    // Stop the game
    function stopGame() {
        clearInterval(gameLoop);
        gameStarted = false;
        gamePaused = false;
        
        // Reset button text to "Start Game"
        startButton.textContent = "Start Game";
        startButton.classList.remove('stop-btn');
    }
    
    // Clear all game elements
    function clearGameElements() {
        // Remove all snake parts and ball
        gameContainer.querySelectorAll('.snake-part, .ball').forEach(element => {
            element.remove();
        });
    }
    
    // Create a new ball at a random position
    function createBall() {
        // Remove existing ball if any
        if (ball && ball.element) {
            ball.element.remove();
        }
        
        // Create new ball element
        let ballElement = document.createElement('div');
        ballElement.className = 'ball';
        ballElement.style.width = `${BALL_SIZE}px`;
        ballElement.style.height = `${BALL_SIZE}px`;
        
        // Calculate grid-aligned random position
        let maxX = Math.floor((GAME_WIDTH - BALL_SIZE) / gridSize);
        let maxY = Math.floor((GAME_HEIGHT - BALL_SIZE) / gridSize);
        
        // Ensure we have valid dimensions to prevent infinite loops
        if (maxX <= 0) maxX = 1;
        if (maxY <= 0) maxY = 1;
        
        let x = Math.floor(Math.random() * maxX) * gridSize;
        let y = Math.floor(Math.random() * maxY) * gridSize;
        
        // Add safety margin
        x = Math.min(x, GAME_WIDTH - BALL_SIZE - gridSize);
        y = Math.min(y, GAME_HEIGHT - BALL_SIZE - gridSize);
        
        // Ensure ball doesn't spawn on snake
        let isOnSnake = true;
        let attempts = 0;
        const MAX_ATTEMPTS = 50;
        
        while (isOnSnake && attempts < MAX_ATTEMPTS) {
            isOnSnake = false;
            attempts++;
            
            for (let part of snake) {
                if (Math.abs(part.x - x) < gridSize && Math.abs(part.y - y) < gridSize) {
                    isOnSnake = true;
                    x = Math.floor(Math.random() * maxX) * gridSize;
                    y = Math.floor(Math.random() * maxY) * gridSize;
                    
                    // Add safety margin
                    x = Math.min(x, GAME_WIDTH - BALL_SIZE - gridSize);
                    y = Math.min(y, GAME_HEIGHT - BALL_SIZE - gridSize);
                    break;
                }
            }
        }
        
        // If we couldn't find a free spot, place it in a default position
        if (attempts >= MAX_ATTEMPTS) {
            console.log("Failed to find free spot for ball, using default position");
            x = GAME_WIDTH - 3 * gridSize;
            y = GAME_HEIGHT - 3 * gridSize;
        }
        
        // Position the ball
        ballElement.style.left = x + 'px';
        ballElement.style.top = y + 'px';
        
        gameContainer.appendChild(ballElement);
        
        ball = {
            element: ballElement,
            x: x,
            y: y
        };
    }
    
    // Update game state
    function updateGame() {
        // Update direction
        direction = nextDirection;
        
        // Calculate new head position
        let headX = snake[0].x;
        let headY = snake[0].y;
        
        switch (direction) {
            case 'up': headY -= gridSize; break;
            case 'down': headY += gridSize; break;
            case 'left': headX -= gridSize; break;
            case 'right': headX += gridSize; break;
        }
        
        // Check collision with walls - add proper boundary detection
        if (headX < 0 || headX + gridSize > GAME_WIDTH || 
            headY < 0 || headY + gridSize > GAME_HEIGHT) {
            console.log(`Wall collision at ${headX},${headY}`);
            gameOver();
            return;
        }
        
        // Check collision with self
        for (let i = 1; i < snake.length; i++) {
            if (headX === snake[i].x && headY === snake[i].y) {
                console.log(`Self collision at ${headX},${headY}`);
                gameOver();
                return;
            }
        }
        
        // Check if snake eats the ball
        let eatsBall = false;
        if (ball) {
            const ballCenterX = ball.x + BALL_SIZE / 2;
            const ballCenterY = ball.y + BALL_SIZE / 2;
            const headCenterX = headX + gridSize / 2;
            const headCenterY = headY + gridSize / 2;
            
            // Use distance between centers for more accurate collision
            const distance = Math.sqrt(
                Math.pow(ballCenterX - headCenterX, 2) + 
                Math.pow(ballCenterY - headCenterY, 2)
            );
            
            eatsBall = distance < (gridSize / 2 + BALL_SIZE / 2);
        }
        
        // Create new head
        let newHead = document.createElement('div');
        newHead.className = 'snake-part snake-head';
        newHead.style.width = `${gridSize}px`;
        newHead.style.height = `${gridSize}px`;
        newHead.style.left = headX + 'px';
        newHead.style.top = headY + 'px';
        gameContainer.appendChild(newHead);
        
        // Update first element to be a regular snake part
        if (snake.length > 0) {
            snake[0].element.classList.remove('snake-head');
        }
        
        // Add new head to snake array
        snake.unshift({
            element: newHead,
            x: headX,
            y: headY
        });
        
        // If not eating ball, remove tail
        if (!eatsBall) {
            let tail = snake.pop();
            tail.element.remove();
        } else {
            // Snake eats ball
            score++;
            updateScore();
            createBall();
            
            // Increase game speed
            if (gameSpeed > MIN_SPEED) {
                gameSpeed = Math.max(MIN_SPEED, gameSpeed - SPEED_DECREASE_FACTOR);
                clearInterval(gameLoop);
                gameLoop = setInterval(updateGame, gameSpeed);
            }
        }
    }
    
    // Update score display
    function updateScore() {
        scoreElement.textContent = `Score: ${score}`;
    }
    
    // Game over
    function gameOver() {
        clearInterval(gameLoop);
        gameStarted = false;
        gamePaused = false;
        finalScoreElement.textContent = `Score: ${score}`;
        gameOverElement.classList.add('visible');
        
        // Reset button text
        startButton.textContent = "Start Game";
        startButton.classList.remove('stop-btn');
    }
    
    // Handle direction change with prevention of illegal moves
    function changeDirection(newDirection) {
        if (!gameStarted || gamePaused) return;
        
        // Prevent 180-degree turns (snake can't turn back on itself)
        if (
            (direction === 'up' && newDirection === 'down') ||
            (direction === 'down' && newDirection === 'up') ||
            (direction === 'left' && newDirection === 'right') ||
            (direction === 'right' && newDirection === 'left')
        ) {
            return;
        }
        
        nextDirection = newDirection;
        
        // Highlight active direction button
        directionButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-direction') === newDirection) {
                btn.classList.add('active');
            }
        });
    }
    
    // Touch gesture handlers
    function handleTouchStart(e) {
        if (!gameStarted || gamePaused) return;
        
        const touch = e.touches[0];
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
        
        e.preventDefault(); // Prevent scrolling while touching the game area
    }
    
    function handleTouchMove(e) {
        if (!gameStarted || gamePaused || !touchStartX || !touchStartY) return;
        
        const touch = e.touches[0];
        const touchEndX = touch.clientX;
        const touchEndY = touch.clientY;
        
        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;
        
        // Determine swipe direction if it exceeds threshold
        if (Math.abs(deltaX) > SWIPE_THRESHOLD || Math.abs(deltaY) > SWIPE_THRESHOLD) {
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                // Horizontal swipe
                changeDirection(deltaX > 0 ? 'right' : 'left');
            } else {
                // Vertical swipe
                changeDirection(deltaY > 0 ? 'down' : 'up');
            }
            
            // Reset touch start position to allow continuous swiping
            touchStartX = touchEndX;
            touchStartY = touchEndY;
        }
        
        e.preventDefault(); // Prevent scrolling
    }
    
    function handleTouchEnd() {
        touchStartX = 0;
        touchStartY = 0;
    }
    
    // Handle window resize
    function handleResize() {
        if (gameStarted) {
            pauseGame();
            // Update dimensions after a small delay
            setTimeout(() => {
                updateGameDimensions();
                
                // Rescale snake and ball based on new grid size
                snake.forEach(part => {
                    part.element.style.width = `${gridSize}px`;
                    part.element.style.height = `${gridSize}px`;
                });
                
                if (ball && ball.element) {
                    // Keep ball in bounds
                    ball.x = Math.min(ball.x, GAME_WIDTH - BALL_SIZE);
                    ball.y = Math.min(ball.y, GAME_HEIGHT - BALL_SIZE);
                    ball.element.style.left = ball.x + 'px';
                    ball.element.style.top = ball.y + 'px';
                }
            }, 200);
        } else {
            updateGameDimensions();
        }
    }
    
    // Handle document visibility change (tab switching, etc.)
    function handleVisibilityChange() {
        if (document.hidden && gameStarted && !gamePaused) {
            pauseGame();
            visibilityPaused = true;
        } else if (!document.hidden && gameStarted && gamePaused && visibilityPaused) {
            visibilityPaused = false;
            // Don't auto-resume, let the user explicitly resume
        }
    }
    
    // Prevent scrolling when touching game container
    function preventScroll(e) {
        if (gameStarted) {
            e.preventDefault();
        }
    }
    
    // Prevent context menu on long press
    function preventContextMenu(e) {
        e.preventDefault();
        return false;
    }
    
    // Initialize event listeners
    function initEventListeners() {
        // Window events
        window.addEventListener('resize', handleResize);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        // Game control buttons
        startButton.addEventListener('click', () => {
            if (!gameStarted) {
                gameOverElement.classList.remove('visible');
                initGame();
            } else {
                stopGame();
            }
        });
        
        restartButton.addEventListener('click', () => {
            gameOverElement.classList.remove('visible');
            initGame();
        });
        
        resumeButton.addEventListener('click', resumeGame);
        
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (e.key === ' ') { // Space bar
                if (gamePaused) {
                    resumeGame();
                } else if (gameStarted) {
                    pauseGame();
                }
                e.preventDefault();
                return;
            }
            
            switch (e.key) {
                case 'ArrowUp':
                    changeDirection('up');
                    e.preventDefault();
                    break;
                case 'ArrowDown':
                    changeDirection('down');
                    e.preventDefault();
                    break;
                case 'ArrowLeft':
                    changeDirection('left');
                    e.preventDefault();
                    break;
                case 'ArrowRight':
                    changeDirection('right');
                    e.preventDefault();
                    break;
            }
        });
        
        // Control buttons - for both touch and click
        directionButtons.forEach(button => {
            const dir = button.getAttribute('data-direction');
            
            button.addEventListener('touchstart', (e) => {
                changeDirection(dir);
                e.preventDefault(); // Prevent double events
            });
            
            button.addEventListener('mousedown', () => {
                changeDirection(dir);
            });
        });
        
        // Touch gesture controls
        swipeArea.addEventListener('touchstart', handleTouchStart, { passive: false });
        swipeArea.addEventListener('touchmove', handleTouchMove, { passive: false });
        swipeArea.addEventListener('touchend', handleTouchEnd);
        
        // Prevent default touch behaviors
        gameContainer.addEventListener('touchmove', preventScroll, { passive: false });
        gameContainer.addEventListener('contextmenu', preventContextMenu);
    }
    
    // Initialize the game
    function init() {
        updateGameDimensions();
        initEventListeners();
    }
    
    // Start initialization
    init();
});