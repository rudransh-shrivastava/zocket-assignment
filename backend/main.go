package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/joho/godotenv"
	"github.com/rudransh-shrivastava/zocket-assignmnet/backend/controller"
	"github.com/rudransh-shrivastava/zocket-assignmnet/backend/database"
	"github.com/rudransh-shrivastava/zocket-assignmnet/backend/middleware"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

	database.ConnectDB()

	mux := http.NewServeMux()

	// Setup routes
	setupRoutes(mux)

	// Apply middleware chain
	// Apply middleware chain in correct order

	handler := corsMiddleware(LoggingMiddleware(RecoveryMiddleware(mux)))

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server listening on :%s", port)
	log.Fatal(http.ListenAndServe(":"+port, handler))
}

func setupRoutes(mux *http.ServeMux) {
	// Auth routes
	mux.HandleFunc("POST /api/auth/register", controller.RegisterUser)
	mux.HandleFunc("POST /api/auth/login", controller.LoginUser)

	// Task routes with auth middleware
	mux.HandleFunc("GET /api/tasks/", middleware.AuthMiddleware(controller.GetAllTasks))
	mux.HandleFunc("POST /api/tasks", middleware.AuthMiddleware(controller.CreateTask))
	mux.HandleFunc("OPTIONS /api/tasks/", handleCORSOptions)
	mux.HandleFunc("GET /api/tasks/{id}/", middleware.AuthMiddleware(controller.GetTaskByID))
	mux.HandleFunc("PUT /api/tasks/{id}/", middleware.AuthMiddleware(controller.UpdateTask))
	mux.HandleFunc("DELETE /api/tasks/{id}/", middleware.AuthMiddleware(controller.DeleteTask))

	// AI Suggestions route
	mux.HandleFunc("POST /api/ai/suggest", middleware.AuthMiddleware(controller.GetAISuggestions))

	// // WebSocket route
	// mux.HandleFunc("GET /ws/{id}/", func(w http.ResponseWriter, r *http.Request) {
	// 	// WebSocket implementation
	// })
}

// Middleware implementations
func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "*")

		// Handle preflight requests
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func handleCORSOptions(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
}

func LoggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		next.ServeHTTP(w, r)
		log.Printf("%s %s %v", r.Method, r.URL.Path, time.Since(start))
	})
}

func RecoveryMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if err := recover(); err != nil {
				w.WriteHeader(http.StatusInternalServerError)
				json.NewEncoder(w).Encode(map[string]string{"error": "Internal server error"})
				log.Printf("Panic: %v", err)
			}
		}()
		next.ServeHTTP(w, r)
	})
}
