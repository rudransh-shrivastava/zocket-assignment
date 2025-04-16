package model

import (
	"time"

	"gorm.io/gorm"
)

type User struct {
	gorm.Model
	Name     string `json:"name"`
	Email    string `json:"email" gorm:"unique"`
	Password string `json:"-"`
	Tasks    []Task `json:"tasks,omitempty" gorm:"foreignKey:AssignedTo"`
}

type Task struct {
	gorm.Model
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Status      string    `json:"status" gorm:"default:pending"`
	Priority    string    `json:"priority" gorm:"default:medium"`
	DueDate     time.Time `json:"due_date"`
	AssignedTo  uint      `json:"assigned_to"`
	CreatedBy   uint      `json:"created_by"`
	User        User      `json:"user,omitempty" gorm:"foreignKey:AssignedTo"`
}

type LoginInput struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

type RegisterInput struct {
	Name     string `json:"name" validate:"required"`
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=6"`
}

type TaskInput struct {
	Title       string    `json:"title" validate:"required"`
	Description string    `json:"description"`
	Status      string    `json:"status"`
	Priority    string    `json:"priority"`
	DueDate     time.Time `json:"due_date"`
	AssignedTo  uint      `json:"assigned_to"`
}

type AISuggestionInput struct {
	TaskDescription string `json:"task_description" validate:"required"`
}
