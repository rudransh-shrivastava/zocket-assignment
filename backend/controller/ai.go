package controller

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/rudransh-shrivastava/zocket-assignmnet/backend/model"
)

// OpenAI request structure
type OpenAIRequest struct {
	Model       string          `json:"model"`
	Messages    []OpenAIMessage `json:"messages"`
	Temperature float64         `json:"temperature"`
}

type OpenAIMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// OpenAI response structure
type OpenAIResponse struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
}

// GetAISuggestions generates AI-powered task suggestions
func GetAISuggestions(c *fiber.Ctx) error {
	var input model.AISuggestionInput

	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid input data",
		})
	}

	// Validate required fields
	if input.TaskDescription == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Task description is required",
		})
	}

	// Prepare OpenAI API request
	prompt := fmt.Sprintf(
		"Based on this task description: '%s', please provide: 1) A better title for this task, 2) A list of 3-5 subtasks that would help complete this task, 3) A suggested priority level (low, medium, high), and 4) A reasonable time estimate for completing this task. Format the response as JSON with these fields: 'title', 'subtasks' (array), 'priority', and 'timeEstimate'.",
		input.TaskDescription,
	)

	openaiReq := OpenAIRequest{
		Model: "gpt-3.5-turbo",
		Messages: []OpenAIMessage{
			{
				Role:    "system",
				Content: "You are a helpful task management assistant that breaks down tasks into actionable subtasks and provides smart suggestions.",
			},
			{
				Role:    "user",
				Content: prompt,
			},
		},
		Temperature: 0.7,
	}

	// Convert request to JSON
	reqBody, err := json.Marshal(openaiReq)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Could not process AI request",
		})
	}

	// Make request to OpenAI API
	client := &http.Client{}
	req, err := http.NewRequest("POST", "https://api.openai.com/v1/chat/completions", bytes.NewBuffer(reqBody))
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Could not create AI request",
		})
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+os.Getenv("OPENAI_API_KEY"))

	resp, err := client.Do(req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Could not connect to AI service",
		})
	}
	defer resp.Body.Close()

	// Check response status
	if resp.StatusCode != http.StatusOK {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "AI service returned an error",
		})
	}

	// Parse response
	var openaiResp OpenAIResponse
	if err := json.NewDecoder(resp.Body).Decode(&openaiResp); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Could not parse AI response",
		})
	}

	// Extract suggestions
	if len(openaiResp.Choices) == 0 {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "AI service did not return any suggestions",
		})
	}

	// Return AI suggestions
	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"suggestions": json.RawMessage(openaiResp.Choices[0].Message.Content),
	})
}
