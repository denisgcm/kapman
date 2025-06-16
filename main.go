package main

import (
	"embed"
	"encoding/json"
	"fmt"
	"io/fs"
	"log"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	bolt "go.etcd.io/bbolt"
)

//go:embed web
var staticFS embed.FS

type Score struct {
	Name  string    `json:"name"`
	Score int       `json:"score"`
	Date  time.Time `json:"date"`
}

type GameServer struct {
	db *bolt.DB
}

func main() {
	// Get port from environment or use default
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Initialize database
	db, err := bolt.Open("scores.db", 0600, nil)
	if err != nil {
		log.Fatal("Failed to open database:", err)
	}
	defer db.Close()

	// Create scores bucket if it doesn't exist
	err = db.Update(func(tx *bolt.Tx) error {
		_, err := tx.CreateBucketIfNotExists([]byte("scores"))
		return err
	})
	if err != nil {
		log.Fatal("Failed to create scores bucket:", err)
	}

	server := &GameServer{db: db}

	// Setup router
	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	// API routes
	r.Route("/api", func(r chi.Router) {
		r.Post("/scores", server.submitScore)
		r.Get("/scores", server.getHighScores)
	})

	// Serve embedded static files
	webFS, err := fs.Sub(staticFS, "web")
	if err != nil {
		log.Fatal("Failed to create web filesystem:", err)
	}
	r.Handle("/*", http.FileServer(http.FS(webFS)))

	fmt.Printf("🎮 Kapman server starting on http://localhost:%s\n", port)
	log.Fatal(http.ListenAndServe(":"+port, r))
}

func (s *GameServer) submitScore(w http.ResponseWriter, r *http.Request) {
	var score Score
	if err := json.NewDecoder(r.Body).Decode(&score); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	score.Date = time.Now()

	// Store score in database
	err := s.db.Update(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte("scores"))
		id, _ := bucket.NextSequence()
		encoded, err := json.Marshal(score)
		if err != nil {
			return err
		}
		return bucket.Put([]byte(strconv.FormatUint(id, 10)), encoded)
	})

	if err != nil {
		http.Error(w, "Failed to save score", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "success"})
}

func (s *GameServer) getHighScores(w http.ResponseWriter, r *http.Request) {
	var scores []Score

	err := s.db.View(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte("scores"))
		cursor := bucket.Cursor()

		for k, v := cursor.Last(); k != nil; k, v = cursor.Prev() {
			var score Score
			if err := json.Unmarshal(v, &score); err != nil {
				continue
			}
			scores = append(scores, score)
			if len(scores) >= 10 { // Top 10 scores
				break
			}
		}
		return nil
	})

	if err != nil {
		http.Error(w, "Failed to retrieve scores", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(scores)
}