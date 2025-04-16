package controller

import (
	"github.com/gofiber/fiber/v2"
	"github.com/rudransh-shrivastava/zocket-assignmnet/backend/database"
	"github.com/rudransh-shrivastava/zocket-assignmnet/backend/model"
	"github.com/rudransh-shrivastava/zocket-assignmnet/backend/websocket"
)

// GetAllTasks retrieves all tasks for the current user
func GetAllTasks(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(uint)

	var tasks []model.Task
	if result := database.DB.Where("assigned_to = ?", userID).Find(&tasks); result.Error != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Could not retrieve tasks",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"tasks": tasks,
	})
}

// GetTaskByID retrieves a specific task by ID
func GetTaskByID(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(uint)
	taskID := c.Params("id")

	var task model.Task
	if result := database.DB.Where("id = ? AND (assigned_to = ? OR created_by = ?)", taskID, userID, userID).First(&task); result.Error != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Task not found",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"task": task,
	})
}

// CreateTask creates a new task
func CreateTask(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(uint)

	var input model.TaskInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid input data",
		})
	}

	// Validate required fields
	if input.Title == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Title is required",
		})
	}

	// Create new task
	task := model.Task{
		Title:       input.Title,
		Description: input.Description,
		Status:      input.Status,
		Priority:    input.Priority,
		DueDate:     input.DueDate,
		AssignedTo:  input.AssignedTo,
		CreatedBy:   userID,
	}

	// If no assignee specified, assign to self
	if task.AssignedTo == 0 {
		task.AssignedTo = userID
	}

	if result := database.DB.Create(&task); result.Error != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Could not create task",
		})
	}

	// Notify via WebSocket
	websocket.BroadcastTaskUpdate(task, "created")

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"task": task,
	})
}

// UpdateTask updates an existing task
func UpdateTask(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(uint)
	taskID := c.Params("id")

	// Find existing task
	var task model.Task
	if result := database.DB.Where("id = ? AND (assigned_to = ? OR created_by = ?)", taskID, userID, userID).First(&task); result.Error != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Task not found",
		})
	}

	// Parse update data
	var input model.TaskInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid input data",
		})
	}

	// Update task fields
	if input.Title != "" {
		task.Title = input.Title
	}
	if input.Description != "" {
		task.Description = input.Description
	}
	if input.Status != "" {
		task.Status = input.Status
	}
	if input.Priority != "" {
		task.Priority = input.Priority
	}
	if !input.DueDate.IsZero() {
		task.DueDate = input.DueDate
	}
	if input.AssignedTo != 0 {
		task.AssignedTo = input.AssignedTo
	}

	// Save updated task
	if result := database.DB.Save(&task); result.Error != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Could not update task",
		})
	}

	// Notify via WebSocket
	websocket.BroadcastTaskUpdate(task, "updated")

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"task": task,
	})
}

// DeleteTask deletes a task
func DeleteTask(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(uint)
	taskID := c.Params("id")

	// Find existing task
	var task model.Task
	if result := database.DB.Where("id = ? AND (assigned_to = ? OR created_by = ?)", taskID, userID, userID).First(&task); result.Error != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Task not found",
		})
	}

	// Delete task
	if result := database.DB.Delete(&task); result.Error != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Could not delete task",
		})
	}

	// Notify via WebSocket
	websocket.BroadcastTaskUpdate(task, "deleted")

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Task deleted successfully",
	})
}
