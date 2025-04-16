package controller

import (
	"encoding/json"
	"net/http"

	"github.com/rudransh-shrivastava/zocket-assignmnet/backend/database"
	"github.com/rudransh-shrivastava/zocket-assignmnet/backend/middleware"
	"github.com/rudransh-shrivastava/zocket-assignmnet/backend/model"
	"gorm.io/gorm"
)

func GetAllTasks(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(middleware.UserIDKey).(uint)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var tasks []model.Task
	if err := database.DB.Where("assigned_to = ?", userID).Find(&tasks).Error; err != nil {
		http.Error(w, "Could not retrieve tasks", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"tasks": tasks})
}

func GetTaskByID(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(middleware.UserIDKey).(uint)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	taskID := r.PathValue("id")

	var task model.Task
	if err := database.DB.Where("id = ? AND (assigned_to = ? OR created_by = ?)", taskID, userID, userID).First(&task).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			http.Error(w, "Task not found", http.StatusNotFound)
			return
		}
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"task": task})
}

func CreateTask(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(middleware.UserIDKey).(uint)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var input model.TaskInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid input data", http.StatusBadRequest)
		return
	}

	if input.Title == "" {
		http.Error(w, "Title is required", http.StatusBadRequest)
		return
	}

	task := model.Task{
		Title:       input.Title,
		Description: input.Description,
		Status:      input.Status,
		Priority:    input.Priority,
		DueDate:     input.DueDate,
		AssignedTo:  input.AssignedTo,
		CreatedBy:   userID,
	}

	if task.AssignedTo == 0 {
		task.AssignedTo = userID
	}

	if err := database.DB.Create(&task).Error; err != nil {
		http.Error(w, "Could not create task", http.StatusInternalServerError)
		return
	}

	// websocket.BroadcastTaskUpdate(task, "created")

	w.Header().Set("Content-Type", "application/json")

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{"task": task})
}

func UpdateTask(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(middleware.UserIDKey).(uint)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	taskID := r.PathValue("id")

	var task model.Task
	if err := database.DB.Where("id = ? AND (assigned_to = ? OR created_by = ?)", taskID, userID, userID).First(&task).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			http.Error(w, "Task not found", http.StatusNotFound)
			return
		}
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	var input model.TaskInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid input data", http.StatusBadRequest)
		return
	}

	// Update fields
	if input.Title != "" {
		task.Title = input.Title
	}
	task.Description = input.Description
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

	if err := database.DB.Save(&task).Error; err != nil {
		http.Error(w, "Could not update task", http.StatusInternalServerError)
		return
	}

	// websocket.BroadcastTaskUpdate(task, "updated")

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"task": task})
}

func DeleteTask(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(middleware.UserIDKey).(uint)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	taskID := r.PathValue("id")

	var task model.Task
	if err := database.DB.Where("id = ? AND (assigned_to = ? OR created_by = ?)", taskID, userID, userID).First(&task).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			http.Error(w, "Task not found", http.StatusNotFound)
			return
		}
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	if err := database.DB.Delete(&task).Error; err != nil {
		http.Error(w, "Could not delete task", http.StatusInternalServerError)
		return
	}

	// websocket.BroadcastTaskUpdate(task, "deleted")

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"message": "Task deleted successfully"})
}
