# 🎮 Kapman

A Kubernetes-themed Pac-Man clone built with Go and HTML5 Canvas.

## Features

- **Kapman Character**: Play as a solid blue 'K' navigating through mazes
- **Cloud Ghosts**: Animated cloud enemies with different AI behaviors
- **Kubernetes Pods**: Collect pod pellets and super pods for points
- **Scoring System**: Standard Pac-Man scoring with high score tracking
- **Ghost AI**: Different ghost behaviors (chase, scatter, frightened)
- **Multiple Lives**: Classic 3-life system
- **Progressive Levels**: Increasing difficulty
- **BoltDB Integration**: Persistent high score storage

## Technology Stack

- **Backend**: Go with Chi router and BoltDB
- **Frontend**: HTML5 Canvas, CSS, JavaScript
- **Embedded Assets**: Frontend served from Go binary using embed package

## Controls

- **Arrow Keys** or **WASD**: Move Kapman
- **P**: Pause/Resume game
- **R**: Restart level
- **SPACE**: Start game

## Scoring

| Action | Points |
|--------|--------|
| Pod | 10 |
| Super Pod | 50 |
| Ghost (1st) | 200 |
| Ghost (2nd) | 400 |
| Ghost (3rd) | 800 |
| Ghost (4th) | 1600 |

## Build & Run

1. **Install dependencies**:
   ```bash
   go mod tidy
   ```

2. **Build the game**:
   ```bash
   go build -o kapman .
   ```

3. **Run the server**:
   ```bash
   ./kapman
   ```

4. **Play the game**:
   Open your browser and go to `http://localhost:8080`

## Development

### Prerequisites
- Go 1.21 or later
- Modern web browser

### Project Structure
```
kapman/
├── main.go                  # Go server with embedded frontend
├── internal/
│   └── game/                # Game logic (future expansion)
├── web/
│   ├── index.html           # Game HTML interface
│   ├── style.scss           # Game styling (SCSS)
│   ├── style.css            # Compiled CSS
│   └── main.js              # Game logic (JavaScript)
├── static/
│   └── assets/              # Game assets
├── go.mod                   # Go dependencies
└── README.md
```

### Environment Variables
- `PORT`: Server port (default: 8080)

## Game Mechanics

### Kapman
- Moves through maze collecting pods
- Controlled with arrow keys or WASD
- Cannot move through walls
- Wraps around screen edges (tunnel effect)

### Ghosts
- Four cloud ghosts with different colors
- Chase or scatter behavior
- Turn blue and flee when Kapman eats super pod
- Reset to ghost house when eaten

### Maze
- 40x30 grid layout
- Walls block movement
- Pods provide points
- Super pods activate frightened mode

### Winning & Losing
- **Win**: Collect all pods to advance to next level
- **Lose**: Lose all 3 lives by touching ghosts
- **High Scores**: Stored persistently in BoltDB

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Credits

Inspired by the classic Pac-Man arcade game, with a modern Kubernetes twist.

---

© 2025 Kapman Project. MIT License.