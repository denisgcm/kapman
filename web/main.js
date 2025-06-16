// Kapman Game Logic
class KapmanGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.overlay = document.getElementById('gameOverlay');
        
        // Game state
        this.gameState = 'menu'; // menu, playing, paused, gameOver
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        
        // Game dimensions
        this.CELL_SIZE = 32;
        this.MAZE_WIDTH = 25;
        this.MAZE_HEIGHT = 18;
        
        // Colors
        this.COLORS = {
            WALL: '#34495e',
            POD: '#f39c12',
            SUPER_POD: '#3498db',
            KAPMAN: '#3498db',
            GHOST_NORMAL: ['#e74c3c', '#e67e22', '#f1c40f', '#9b59b6'],
            GHOST_FRIGHTENED: '#5dade2',
            BACKGROUND: '#000000'
        };
        
        // Initialize game objects
        this.initializeMaze();
        this.initializeKapman();
        this.initializeGhosts();
        
        // Event listeners
        this.setupEventListeners();
        
        // Game loop
        this.lastTime = 0;
        this.gameLoop();
        
        // Load high scores
        this.loadHighScores();
    }
    
    initializeMaze() {
        // Simple maze layout (1 = wall, 0 = empty, 2 = pod, 3 = super pod)
        this.maze = Array(this.MAZE_HEIGHT).fill().map(() => Array(this.MAZE_WIDTH).fill(0));
        
        // Create maze walls (simplified pattern)
        for (let y = 0; y < this.MAZE_HEIGHT; y++) {
            for (let x = 0; x < this.MAZE_WIDTH; x++) {
                // Border walls
                if (x === 0 || x === this.MAZE_WIDTH - 1 || y === 0 || y === this.MAZE_HEIGHT - 1) {
                    this.maze[y][x] = 1;
                }
                // Internal walls pattern
                else if ((x % 6 === 0 && y % 4 === 0) || (x % 8 === 4 && y % 6 === 3)) {
                    this.maze[y][x] = 1;
                }
                // Ghost house area (center)
                else if (x >= 18 && x <= 22 && y >= 13 && y <= 17) {
                    this.maze[y][x] = 0;
                }
                // Add pods
                else if (this.maze[y][x] === 0) {
                    // Super pods in corners
                    if ((x === 2 && y === 2) || (x === this.MAZE_WIDTH - 3 && y === 2) ||
                        (x === 2 && y === this.MAZE_HEIGHT - 3) || (x === this.MAZE_WIDTH - 3 && y === this.MAZE_HEIGHT - 3)) {
                        this.maze[y][x] = 3;
                    }
                    // Regular pods
                    else if (Math.random() < 0.7) {
                        this.maze[y][x] = 2;
                    }
                }
            }
        }
        
        this.totalPods = this.countPods();
    }
    
    countPods() {
        let count = 0;
        for (let y = 0; y < this.MAZE_HEIGHT; y++) {
            for (let x = 0; x < this.MAZE_WIDTH; x++) {
                if (this.maze[y][x] === 2 || this.maze[y][x] === 3) {
                    count++;
                }
            }
        }
        return count;
    }
    
    initializeKapman() {
        this.kapman = {
            x: 1,
            y: 1,
            displayX: 1,
            displayY: 1,
            direction: { x: 0, y: 0 },
            nextDirection: { x: 0, y: 0 },
            animationFrame: 0,
            moveTimer: 0,
            moveSpeed: 20, // Move every 20 frames (about 3 moves per second at 60fps)
            isMoving: false,
            moveProgress: 0
        };
    }
    
    initializeGhosts() {
        this.ghosts = [
            { x: 19, y: 14, displayX: 19, displayY: 14, direction: { x: 1, y: 0 }, color: 0, mode: 'patrol', target: { x: 0, y: 0 }, moveTimer: 0, moveSpeed: 25, isMoving: false, moveProgress: 0 },
            { x: 20, y: 14, displayX: 20, displayY: 14, direction: { x: -1, y: 0 }, color: 1, mode: 'patrol', target: { x: 0, y: 0 }, moveTimer: 0, moveSpeed: 25, isMoving: false, moveProgress: 0 },
            { x: 21, y: 14, displayX: 21, displayY: 14, direction: { x: 0, y: -1 }, color: 2, mode: 'patrol', target: { x: 0, y: 0 }, moveTimer: 0, moveSpeed: 25, isMoving: false, moveProgress: 0 },
            { x: 22, y: 14, displayX: 22, displayY: 14, direction: { x: 0, y: 1 }, color: 3, mode: 'patrol', target: { x: 0, y: 0 }, moveTimer: 0, moveSpeed: 25, isMoving: false, moveProgress: 0 }
        ];
        this.ghostModeTimer = 0;
        this.frighteneMode = false;
        this.frightenedTimer = 0;
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            switch (e.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    this.kapman.nextDirection = { x: 0, y: -1 };
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    this.kapman.nextDirection = { x: 0, y: 1 };
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    this.kapman.nextDirection = { x: -1, y: 0 };
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    this.kapman.nextDirection = { x: 1, y: 0 };
                    break;
                case ' ':
                    if (this.gameState === 'menu') {
                        this.startGame();
                    }
                    break;
                case 'p':
                case 'P':
                    if (this.gameState === 'playing') {
                        this.pauseGame();
                    } else if (this.gameState === 'paused') {
                        this.resumeGame();
                    }
                    break;
                case 'r':
                case 'R':
                    this.restartGame();
                    break;
            }
        });
    }
    
    gameLoop(currentTime = 0) {
        this.deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        if (this.gameState === 'playing') {
            this.update();
        }
        
        this.render();
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    update() {
        // Update Kapman
        this.updateKapman();
        
        // Update ghosts
        this.updateGhosts();
        
        // Check collisions
        this.checkCollisions();
        
        // Update timers
        this.updateTimers();
        
        // Check win condition
        if (this.countPods() === 0) {
            this.nextLevel();
        }
    }
    
    updateKapman() {
        // If currently moving, update smooth interpolation
        if (this.kapman.isMoving) {
            this.kapman.moveProgress += 1 / this.kapman.moveSpeed;
            if (this.kapman.moveProgress >= 1) {
                // Movement complete
                this.kapman.moveProgress = 0;
                this.kapman.isMoving = false;
                this.kapman.displayX = this.kapman.x;
                this.kapman.displayY = this.kapman.y;
                
                // Collect pod
                if (this.maze[this.kapman.y][this.kapman.x] === 2) {
                    this.maze[this.kapman.y][this.kapman.x] = 0;
                    this.score += 10;
                    this.updateScore();
                }
                // Collect super pod
                else if (this.maze[this.kapman.y][this.kapman.x] === 3) {
                    this.maze[this.kapman.y][this.kapman.x] = 0;
                    this.score += 50;
                    this.activateFrightenedMode();
                    this.updateScore();
                }
            } else {
                // Interpolate display position
                const prevX = this.kapman.x - this.kapman.direction.x;
                const prevY = this.kapman.y - this.kapman.direction.y;
                this.kapman.displayX = prevX + (this.kapman.x - prevX) * this.kapman.moveProgress;
                this.kapman.displayY = prevY + (this.kapman.y - prevY) * this.kapman.moveProgress;
            }
        } else {
            // Not currently moving, check if we should start a new movement
            this.kapman.moveTimer++;
            
            // Only start new movement when timer reaches moveSpeed threshold
            if (this.kapman.moveTimer >= this.kapman.moveSpeed) {
                this.kapman.moveTimer = 0; // Reset timer
                
                // Try to change direction
                const newX = this.kapman.x + this.kapman.nextDirection.x;
                const newY = this.kapman.y + this.kapman.nextDirection.y;
                
                if (this.canMoveTo(newX, newY)) {
                    this.kapman.direction = { ...this.kapman.nextDirection };
                }
                
                // Try to move Kapman
                const nextX = this.kapman.x + this.kapman.direction.x;
                const nextY = this.kapman.y + this.kapman.direction.y;
                
                if (this.canMoveTo(nextX, nextY)) {
                    // Start new movement
                    this.kapman.x = nextX;
                    this.kapman.y = nextY;
                    this.kapman.isMoving = true;
                    this.kapman.moveProgress = 0;
                    
                    // Handle tunnel effect (wrap around edges)
                    if (this.kapman.x < 0) this.kapman.x = this.MAZE_WIDTH - 1;
                    if (this.kapman.x >= this.MAZE_WIDTH) this.kapman.x = 0;
                }
            }
        }
        
        this.kapman.animationFrame += 0.2;
    }
    
    updateGhosts() {
        this.ghosts.forEach((ghost, index) => {
            // If currently moving, update smooth interpolation
            if (ghost.isMoving) {
                ghost.moveProgress += 1 / ghost.moveSpeed;
                if (ghost.moveProgress >= 1) {
                    // Movement complete
                    ghost.moveProgress = 0;
                    ghost.isMoving = false;
                    ghost.displayX = ghost.x;
                    ghost.displayY = ghost.y;
                } else {
                    // Interpolate display position
                    const prevX = ghost.x - ghost.direction.x;
                    const prevY = ghost.y - ghost.direction.y;
                    ghost.displayX = prevX + (ghost.x - prevX) * ghost.moveProgress;
                    ghost.displayY = prevY + (ghost.y - prevY) * ghost.moveProgress;
                }
            } else {
                // Not currently moving, check if we should start a new movement
                ghost.moveTimer++;
                
                // Ghosts move slower when frightened
                const currentMoveSpeed = this.frighteneMode ? ghost.moveSpeed + 10 : ghost.moveSpeed;
                
                // Only start new movement when timer reaches moveSpeed threshold
                if (ghost.moveTimer >= currentMoveSpeed) {
                    ghost.moveTimer = 0; // Reset timer
                    
                    // Calculate distance to Kapman
                    const distanceToKapman = Math.abs(ghost.x - this.kapman.x) + Math.abs(ghost.y - this.kapman.y);
                    
                    // Determine ghost behavior based on proximity (5 cells or less = chase)
                    if (distanceToKapman <= 5 && !this.frighteneMode) {
                        ghost.mode = 'chase';
                        ghost.target = { x: this.kapman.x, y: this.kapman.y };
                    } else {
                        ghost.mode = 'patrol';
                        // Different independent AI behavior per ghost when not in chase mode
                        switch (index) {
                            case 0: // Red ghost - horizontal patrol
                                if (!ghost.patrolTarget || (ghost.x === ghost.patrolTarget.x && ghost.y === ghost.patrolTarget.y)) {
                                    // Pick a new random horizontal target
                                    ghost.patrolTarget = {
                                        x: Math.floor(Math.random() * this.MAZE_WIDTH),
                                        y: ghost.y
                                    };
                                }
                                ghost.target = ghost.patrolTarget;
                                break;
                            case 1: // Orange ghost - vertical patrol
                                if (!ghost.patrolTarget || (ghost.x === ghost.patrolTarget.x && ghost.y === ghost.patrolTarget.y)) {
                                    // Pick a new random vertical target
                                    ghost.patrolTarget = {
                                        x: ghost.x,
                                        y: Math.floor(Math.random() * this.MAZE_HEIGHT)
                                    };
                                }
                                ghost.target = ghost.patrolTarget;
                                break;
                            case 2: // Yellow ghost - patrol corners
                                const corners = [
                                    { x: 2, y: 2 },
                                    { x: this.MAZE_WIDTH - 3, y: 2 },
                                    { x: this.MAZE_WIDTH - 3, y: this.MAZE_HEIGHT - 3 },
                                    { x: 2, y: this.MAZE_HEIGHT - 3 }
                                ];
                                const nearestCorner = corners.reduce((closest, corner) => {
                                    const distToCurrent = Math.abs(ghost.x - corner.x) + Math.abs(ghost.y - corner.y);
                                    const distToClosest = Math.abs(ghost.x - closest.x) + Math.abs(ghost.y - closest.y);
                                    return distToCurrent < distToClosest ? corner : closest;
                                });
                                ghost.target = nearestCorner;
                                break;
                            case 3: // Purple ghost - completely random movement
                                if (!ghost.randomTarget || Math.random() < 0.1) { // Change target 10% of the time
                                    ghost.randomTarget = {
                                        x: Math.floor(Math.random() * this.MAZE_WIDTH),
                                        y: Math.floor(Math.random() * this.MAZE_HEIGHT)
                                    };
                                }
                                ghost.target = ghost.randomTarget;
                                break;
                        }
                    }
                    
                    // Check if ghost is hitting an obstacle (can't continue in current direction)
                    const currentNextX = ghost.x + ghost.direction.x;
                    const currentNextY = ghost.y + ghost.direction.y;
                    const hitObstacle = !this.canMoveTo(currentNextX, currentNextY);
                    
                    // Get all possible moves
                    const possibleMoves = [
                        { x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }
                    ];
                    
                    // Filter valid moves (exclude reverse direction)
                    const validMoves = possibleMoves.filter(move => {
                        const newX = ghost.x + move.x;
                        const newY = ghost.y + move.y;
                        return this.canMoveTo(newX, newY) && 
                               !(move.x === -ghost.direction.x && move.y === -ghost.direction.y);
                    });
                    
                    let bestMove = ghost.direction;
                    
                    if (validMoves.length > 0) {
                        if (hitObstacle) {
                            // When hitting obstacle, add randomness only in patrol mode
                            if (ghost.mode === 'patrol' && Math.random() < 0.4) { // 40% chance for random direction when hitting obstacle
                                bestMove = validMoves[Math.floor(Math.random() * validMoves.length)];
                            } else {
                                // Pick optimal direction towards target
                                let bestDistance = Infinity;
                                validMoves.forEach(move => {
                                    const newX = ghost.x + move.x;
                                    const newY = ghost.y + move.y;
                                    const distance = Math.abs(ghost.target.x - newX) + Math.abs(ghost.target.y - newY);
                                    if (distance < bestDistance) {
                                        bestDistance = distance;
                                        bestMove = move;
                                    }
                                });
                            }
                        } else {
                            // Not hitting obstacle, use normal pathfinding towards target
                            let bestDistance = Infinity;
                            validMoves.forEach(move => {
                                const newX = ghost.x + move.x;
                                const newY = ghost.y + move.y;
                                const distance = Math.abs(ghost.target.x - newX) + Math.abs(ghost.target.y - newY);
                                if (distance < bestDistance) {
                                    bestDistance = distance;
                                    bestMove = move;
                                }
                            });
                        }
                    }
                    
                    ghost.direction = bestMove;
                    
                    // Try to move ghost
                    const nextX = ghost.x + ghost.direction.x;
                    const nextY = ghost.y + ghost.direction.y;
                    
                    if (this.canMoveTo(nextX, nextY)) {
                        // Start new movement
                        ghost.x = nextX;
                        ghost.y = nextY;
                        ghost.isMoving = true;
                        ghost.moveProgress = 0;
                        
                        // Handle tunnel effect
                        if (ghost.x < 0) ghost.x = this.MAZE_WIDTH - 1;
                        if (ghost.x >= this.MAZE_WIDTH) ghost.x = 0;
                    }
                }
            }
        });
    }
    
    canMoveTo(x, y) {
        if (x < 0 || x >= this.MAZE_WIDTH || y < 0 || y >= this.MAZE_HEIGHT) {
            return false;
        }
        return this.maze[y][x] !== 1;
    }
    
    checkCollisions() {
        this.ghosts.forEach((ghost, index) => {
            // Use display positions for smooth collision detection
            const kapmanDisplayX = this.kapman.displayX || this.kapman.x;
            const kapmanDisplayY = this.kapman.displayY || this.kapman.y;
            const ghostDisplayX = ghost.displayX || ghost.x;
            const ghostDisplayY = ghost.displayY || ghost.y;
            
            if (Math.abs(ghostDisplayX - kapmanDisplayX) < 0.8 && Math.abs(ghostDisplayY - kapmanDisplayY) < 0.8) {
                if (this.frighteneMode) {
                    // Eat ghost
                    this.score += 200 * Math.pow(2, index);
                    this.updateScore();
                    // Reset ghost to house
                    ghost.x = 19 + index;
                    ghost.y = 14;
                    ghost.displayX = ghost.x;
                    ghost.displayY = ghost.y;
                    ghost.isMoving = false;
                    ghost.moveProgress = 0;
                } else {
                    // Kapman dies
                    this.loseLife();
                }
            }
        });
    }
    
    updateTimers() {
        if (this.frighteneMode) {
            this.frightenedTimer--;
            if (this.frightenedTimer <= 0) {
                this.frighteneMode = false;
            }
        }
    }
    
    activateFrightenedMode() {
        this.frighteneMode = true;
        this.frightenedTimer = 300; // 5 seconds at 60fps
    }
    
    loseLife() {
        this.lives--;
        this.updateLives();
        
        if (this.lives <= 0) {
            this.gameOver();
        } else {
            // Reset positions
            this.initializeKapman();
            this.initializeGhosts();
        }
    }
    
    nextLevel() {
        this.level++;
        this.updateLevel();
        this.initializeMaze();
        this.initializeKapman();
        this.initializeGhosts();
    }
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = this.COLORS.BACKGROUND;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Render maze
        this.renderMaze();
        
        // Render Kapman
        this.renderKapman();
        
        // Render ghosts
        this.renderGhosts();
    }
    
    renderMaze() {
        for (let y = 0; y < this.MAZE_HEIGHT; y++) {
            for (let x = 0; x < this.MAZE_WIDTH; x++) {
                const cellX = x * this.CELL_SIZE;
                const cellY = y * this.CELL_SIZE;
                
                switch (this.maze[y][x]) {
                    case 1: // Wall
                        this.ctx.fillStyle = this.COLORS.WALL;
                        this.ctx.fillRect(cellX, cellY, this.CELL_SIZE, this.CELL_SIZE);
                        break;
                    case 2: // Pod
                        this.ctx.fillStyle = this.COLORS.POD;
                        this.ctx.fillRect(cellX + 8, cellY + 8, 4, 4);
                        break;
                    case 3: // Super pod
                        this.ctx.fillStyle = this.COLORS.SUPER_POD;
                        this.ctx.fillRect(cellX + 6, cellY + 6, 8, 8);
                        break;
                }
            }
        }
    }
    
    renderKapman() {
        const x = this.kapman.displayX * this.CELL_SIZE;
        const y = this.kapman.displayY * this.CELL_SIZE;
        
        // Draw Kapman as a blue 'K'
        this.ctx.fillStyle = this.COLORS.KAPMAN;
        this.ctx.font = `${this.CELL_SIZE - 2}px Courier New`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        const centerX = x + this.CELL_SIZE / 2;
        const centerY = y + this.CELL_SIZE / 2;
        
        // Flip based on direction
        this.ctx.save();
        this.ctx.translate(centerX, centerY);
        if (this.kapman.direction.x < 0) {
            this.ctx.scale(-1, 1);
        }
        this.ctx.fillText('K', 0, 0);
        this.ctx.restore();
    }
    
    renderGhosts() {
        this.ghosts.forEach((ghost, index) => {
            const x = ghost.displayX * this.CELL_SIZE;
            const y = ghost.displayY * this.CELL_SIZE;
            
            // Choose color based on mode
            let color = this.frighteneMode ? 
                this.COLORS.GHOST_FRIGHTENED : 
                this.COLORS.GHOST_NORMAL[ghost.color];
            
            this.ctx.fillStyle = color;
            this.ctx.font = `${this.CELL_SIZE - 2}px Courier New`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            
            const centerX = x + this.CELL_SIZE / 2;
            const centerY = y + this.CELL_SIZE / 2;
            
            // Draw ghost as a cloud symbol
            this.ctx.fillText('☁', centerX, centerY);
        });
    }
    
    startGame() {
        this.gameState = 'playing';
        this.hideOverlay();
    }
    
    pauseGame() {
        this.gameState = 'paused';
        this.showOverlay('Paused', 'Press P to resume');
    }
    
    resumeGame() {
        this.gameState = 'playing';
        this.hideOverlay();
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        this.showOverlay('Game Over', `Final Score: ${this.score}<br>Press R to restart`);
        this.submitScore();
    }
    
    restartGame() {
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.updateScore();
        this.updateLives();
        this.updateLevel();
        this.initializeMaze();
        this.initializeKapman();
        this.initializeGhosts();
        this.gameState = 'playing';
        this.hideOverlay();
    }
    
    showOverlay(title, message) {
        document.getElementById('overlayTitle').textContent = title;
        document.getElementById('overlayMessage').innerHTML = message;
        this.overlay.classList.remove('hidden');
    }
    
    hideOverlay() {
        this.overlay.classList.add('hidden');
    }
    
    updateScore() {
        document.getElementById('score').textContent = this.score;
    }
    
    updateLives() {
        document.getElementById('lives').textContent = this.lives;
    }
    
    updateLevel() {
        document.getElementById('level').textContent = this.level;
    }
    
    async submitScore() {
        const playerName = prompt('Enter your name for the high score:') || 'Anonymous';
        try {
            await fetch('/api/scores', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: playerName,
                    score: this.score
                })
            });
            this.loadHighScores();
        } catch (error) {
            console.error('Failed to submit score:', error);
        }
    }
    
    async loadHighScores() {
        try {
            const response = await fetch('/api/scores');
            const scores = await response.json();
            const scoresList = document.getElementById('scoresList');
            
            if (scores && scores.length > 0) {
                scoresList.innerHTML = scores.map(score => 
                    `<div class="score-item">
                        <span class="score-name">${score.name}</span>
                        <span class="score-value">${score.score}</span>
                    </div>`
                ).join('');
            } else {
                scoresList.innerHTML = '<div class="score-item">No scores yet!</div>';
            }
        } catch (error) {
            console.error('Failed to load scores:', error);
            document.getElementById('scoresList').innerHTML = '<div class="score-item">Failed to load scores</div>';
        }
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    new KapmanGame();
});