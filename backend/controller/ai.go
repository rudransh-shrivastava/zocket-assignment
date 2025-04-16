package controller

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"

	"github.com/rudransh-shrivastava/zocket-assignmnet/backend/model"
)

type OpenAIRequest struct {
	Model       string          `json:"model"`
	Messages    []OpenAIMessage `json:"messages"`
	Temperature float64         `json:"temperature"`
}

type OpenAIMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type OpenAIResponse struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
}

type AISuggestionResponse struct {
	Suggestions json.RawMessage `json:"suggestions"`
}

func GetAISuggestions(w http.ResponseWriter, r *http.Request) {
	var input model.AISuggestionInput

	// Parse request body
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid input data", http.StatusBadRequest)
		return
	}

	// Validate input
	if input.TaskDescription == "" {
		http.Error(w, "Task description is required", http.StatusBadRequest)
		return
	}

	// Prepare OpenAI prompt
	prompt := fmt.Sprintf(
		"Based on this task description: '%s', please provide: 1) A better title for this task, 2) A list of 3-5 subtasks that would help complete this task, 3) A suggested priority level (low, medium, high), and 4) A reasonable time estimate for completing this task. Format the response as JSON with these fields: 'title', 'subtasks' (array), 'priority', and 'timeEstimate'.",
		input.TaskDescription,
	)

	// Create OpenAI request
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

	// Marshal request body
	reqBody, err := json.Marshal(openaiReq)
	if err != nil {
		http.Error(w, "Could not process AI request", http.StatusInternalServerError)
		return
	}

	// Create HTTP client and request
	client := &http.Client{}
	req, err := http.NewRequest("POST", "https://api.openai.com/v1/chat/completions", bytes.NewBuffer(reqBody))
	if err != nil {
		http.Error(w, "Could not create AI request", http.StatusInternalServerError)
		return
	}

	// Set headers
	apiKey := os.Getenv("OPENAI_API_KEY")
	if apiKey == "" {
		http.Error(w, "AI service not configured", http.StatusInternalServerError)
		return
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+apiKey)

	// Send request
	resp, err := client.Do(req)
	if err != nil {
		http.Error(w, "Could not connect to AI service", http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	// Check response status
	if resp.StatusCode != http.StatusOK {
		http.Error(w, "AI service returned an error", http.StatusInternalServerError)
		return
	}

	// Parse response
	var openaiResp OpenAIResponse
	if err := json.NewDecoder(resp.Body).Decode(&openaiResp); err != nil {
		http.Error(w, "Could not parse AI response", http.StatusInternalServerError)
		return
	}

	// Validate response
	if len(openaiResp.Choices) == 0 || openaiResp.Choices[0].Message.Content == "" {
		http.Error(w, "No suggestions found in AI response", http.StatusInternalServerError)
		return
	}

	// Prepare and send response
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(AISuggestionResponse{
		Suggestions: json.RawMessage(openaiResp.Choices[0].Message.Content),
	})
}
