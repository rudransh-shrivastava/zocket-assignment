package websocket

// import (
// 	"log"
// 	"sync"

// 	"github.com/gofiber/websocket/v2"
// 	"github.com/rudransh-shrivastava/zocket-assignmnet/backend/model"
// )

// // Client represents a WebSocket client connection
// type Client struct {
// 	Conn     *websocket.Conn
// 	UserID   uint
// 	IsActive bool
// 	mu       sync.Mutex
// }

// // TaskUpdate represents a task update that will be sent via WebSocket
// type TaskUpdate struct {
// 	Task   model.Task `json:"task"`
// 	Action string     `json:"action"` // created, updated, deleted
// 	UserID uint       `json:"user_id"`
// }

// // Global variables
// var (
// 	clients    = make(map[*Client]bool)
// 	register   = make(chan *Client)
// 	unregister = make(chan *Client)
// 	broadcast  = make(chan TaskUpdate)
// 	mutex      = &sync.Mutex{}
// )

// // StartWebSocketHub starts the WebSocket hub
// func StartWebSocketHub() {
// 	for {
// 		select {
// 		case client := <-register:
// 			mutex.Lock()
// 			clients[client] = true
// 			mutex.Unlock()
// 			log.Printf("Client connected: %d active connections\n", len(clients))

// 		case client := <-unregister:
// 			mutex.Lock()
// 			delete(clients, client)
// 			mutex.Unlock()
// 			log.Printf("Client disconnected: %d active connections\n", len(clients))

// 		case update := <-broadcast:
// 			mutex.Lock()
// 			for client := range clients {
// 				// Send update to relevant clients (assigned to or created by)
// 				if client.UserID == update.Task.AssignedTo || client.UserID == update.Task.CreatedBy {
// 					client.mu.Lock()
// 					if client.IsActive {
// 						err := client.Conn.WriteJSON(update)
// 						if err != nil {
// 							log.Printf("WebSocket error: %v", err)
// 							client.IsActive = false
// 							unregister <- client
// 						}
// 					}
// 					client.mu.Unlock()
// 				}
// 			}
// 			mutex.Unlock()
// 		}
// 	}
// }

// // HandleWebSocket handles WebSocket connections
// func HandleWebSocket(c *websocket.Conn) {
// 	// Get user ID from the context (set by auth middleware)
// 	userID := c.Locals("user_id").(uint)

// 	// Create new client
// 	client := &Client{
// 		Conn:     c,
// 		UserID:   userID,
// 		IsActive: true,
// 	}

// 	// Register client
// 	register <- client

// 	// Handle disconnection
// 	defer func() {
// 		unregister <- client
// 		c.Close()
// 	}()

// 	// Read messages (keep connection alive)
// 	for {
// 		messageType, _, err := c.ReadMessage()
// 		if err != nil || messageType == websocket.CloseMessage {
// 			break
// 		}
// 	}
// }

// // BroadcastTaskUpdate sends a task update to all relevant clients
// func BroadcastTaskUpdate(task model.Task, action string) {
// 	update := TaskUpdate{
// 		Task:   task,
// 		Action: action,
// 		UserID: task.AssignedTo,
// 	}

// 	broadcast <- update
// }
