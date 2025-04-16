package main

import (
	"log"
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/websocket/v2"
	"github.com/joho/godotenv"
	"github.com/rudransh-shrivastava/zocket-assignmnet/backend/controller"
	"github.com/rudransh-shrivastava/zocket-assignmnet/backend/database"
	"github.com/rudransh-shrivastava/zocket-assignmnet/backend/middleware"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

	// Initialize Fiber app
	app := fiber.New(fiber.Config{
		ErrorHandler: func(c *fiber.Ctx, err error) error {
			code := fiber.StatusInternalServerError
			if e, ok := err.(*fiber.Error); ok {
				code = e.Code
			}
			return c.Status(code).JSON(fiber.Map{
				"error": err.Error(),
			})
		},
	})

	database.ConnectDB()
	// Middleware
	app.Use(logger.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins:     os.Getenv("ALLOWED_ORIGINS"),
		AllowMethods:     "GET,POST,PUT,DELETE",
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization",
		AllowCredentials: true,
	}))

	// Setup routes
	setupRoutes(app)

	// Setup WebSocket
	app.Use("/ws", func(c *fiber.Ctx) error {
		if websocket.IsWebSocketUpgrade(c) {
			c.Locals("allowed", true)
			return c.Next()
		}
		return fiber.ErrUpgradeRequired
	})

	app.Get("/ws/:id", websocket.New(handleWebSocket))

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Fatal(app.Listen(":" + port))
}

func setupRoutes(app *fiber.App) {
	// API routes group
	api := app.Group("/api")

	// Auth routes
	auth := api.Group("/auth")
	auth.Post("/register", controller.RegisterUser)
	auth.Post("/login", controller.LoginUser)

	// Protected routes
	tasks := api.Group("/tasks", middleware.AuthMiddleware)
	tasks.Get("/", controller.GetAllTasks)
	tasks.Post("/", controller.CreateTask)
	tasks.Get("/:id", controller.GetTaskByID)
	tasks.Put("/:id", controller.UpdateTask)
	tasks.Delete("/:id", controller.DeleteTask)

	// AI Suggestions route
	api.Post("/ai/suggest", middleware.AuthMiddleware, controller.GetAISuggestions)
}

func handleWebSocket(c *websocket.Conn) {
	// WebSocket handler implementation will go here
	// This will handle real-time task updates
}
