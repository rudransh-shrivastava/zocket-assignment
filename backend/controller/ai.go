package controller

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/rudransh-shrivastava/zocket-assignmnet/backend/model"
)

type GeminiRequest struct {
	Contents []Content `json:"contents"`
}

type Content struct {
	Parts []Part `json:"parts"`
}

type Part struct {
	Text string `json:"text"`
}

type GeminiResponse struct {
	Candidates []struct {
		Content struct {
			Parts []Part `json:"parts"`
		} `json:"content"`
	} `json:"candidates"`
}

type AISuggestion struct {
	Title        string   `json:"title"`
	Subtasks     []string `json:"subtasks"`
	Priority     string   `json:"priority"`
	TimeEstimate string   `json:"time_estimate"`
}

type FinalSuggestion struct {
	Title        string   `json:"title"`
	Subtasks     []string `json:"subtasks"`
	Priority     string   `json:"priority"`
	TimeEstimate float64  `json:"time_estimate"` // In days
}

func parseTimeEstimate(timeStr string) (float64, error) {
	// First try to parse as pure number (days)
	if days, err := strconv.ParseFloat(timeStr, 64); err == nil {
		return days, nil
	}

	// Try to parse with units
	var value float64
	var unit string
	_, err := fmt.Sscanf(timeStr, "%f %s", &value, &unit)
	if err != nil {
		return 0, fmt.Errorf("invalid time format")
	}

	unit = strings.ToLower(unit)
	switch unit {
	case "hour", "hours":
		return value / 24, nil
	case "day", "days":
		return value, nil
	case "week", "weeks":
		return value * 7, nil
	default:
		return 0, fmt.Errorf("unknown time unit: %s", unit)
	}
}

func GetAISuggestions(w http.ResponseWriter, r *http.Request) {
	start := time.Now()
	log.Printf("\n[AI] New request started")

	defer func() {
		log.Printf("[AI] Request completed in %v", time.Since(start))
	}()

	bodyBytes, _ := io.ReadAll(r.Body)
	r.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))
	log.Printf("[AI] Raw request: %s", bodyBytes)

	var input model.AISuggestionInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		log.Printf("[AI] JSON decode error: %v", err)
		http.Error(w, "Invalid input data", http.StatusBadRequest)
		return
	}

	if input.TaskDescription == "" {
		log.Printf("[AI] Empty task description")
		http.Error(w, "Task description is required", http.StatusBadRequest)
		return
	}

	prompt := fmt.Sprintf(
		`Analyze this task: "%s". Provide JSON with:
- title (short string)
- subtasks (array of 3-5 strings)
- priority (low/medium/high)
- time_estimate (number of days) as string
Example: {"title": "Project Setup", "subtasks": ["Install dependencies", "Configure CI/CD"], "priority": "high", "time_estimate": "2"}
Return ONLY valid JSON:`,
		input.TaskDescription,
	)
	log.Printf("[AI] Generated prompt: %s", prompt)

	geminiReq := GeminiRequest{
		Contents: []Content{{
			Parts: []Part{{Text: prompt}},
		}},
	}

	reqBody, err := json.Marshal(geminiReq)
	if err != nil {
		log.Printf("[AI] Marshal error: %v", err)
		http.Error(w, "Error creating AI request", http.StatusInternalServerError)
		return
	}

	apiKey := os.Getenv("GEMINI_API_KEY")
	if apiKey == "" {
		log.Printf("[AI] Missing API key")
		http.Error(w, "AI service unavailable", http.StatusInternalServerError)
		return
	}

	url := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=%s", apiKey)
	req, _ := http.NewRequest("POST", url, bytes.NewBuffer(reqBody))
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("[AI] HTTP error: %v", err)
		http.Error(w, "Connection to AI failed", http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	log.Printf("[AI] Raw response: %s", respBody)

	if resp.StatusCode != http.StatusOK {
		log.Printf("[AI] Non-200 response: %d", resp.StatusCode)
		http.Error(w, "AI service error", http.StatusInternalServerError)
		return
	}

	var geminiResp GeminiResponse
	if err := json.Unmarshal(respBody, &geminiResp); err != nil {
		log.Printf("[AI] Response parse error: %v", err)
		http.Error(w, "Invalid AI response", http.StatusInternalServerError)
		return
	}

	if len(geminiResp.Candidates) == 0 || len(geminiResp.Candidates[0].Content.Parts) == 0 {
		log.Printf("[AI] Empty response from Gemini")
		http.Error(w, "No suggestions generated", http.StatusInternalServerError)
		return
	}

	generatedText := geminiResp.Candidates[0].Content.Parts[0].Text
	log.Printf("[AI] Raw generated JSON: %s", generatedText)

	// Extract JSON from markdown code blocks
	cleanedJSON, err := extractJSON(generatedText)
	if err != nil {
		log.Printf("[AI] JSON extraction error: %v", err)
		http.Error(w, "Invalid response format", http.StatusInternalServerError)
		return
	}

	// Validate JSON structure
	var suggestions AISuggestion
	if err := json.Unmarshal([]byte(cleanedJSON), &suggestions); err != nil {
		log.Printf("[AI] JSON parse error: %v\nContent: %s", err, cleanedJSON)
		http.Error(w, "Invalid suggestion format", http.StatusInternalServerError)
		return
	}

	// Convert time estimate to days
	timeEstimateDays, err := parseTimeEstimate(suggestions.TimeEstimate)
	if err != nil {
		log.Printf("[AI] Time estimate error: %v", err)
		http.Error(w, "Invalid time estimate format", http.StatusInternalServerError)
		return
	}

	finalSuggestion := FinalSuggestion{
		Title:        suggestions.Title,
		Subtasks:     suggestions.Subtasks,
		Priority:     strings.ToLower(suggestions.Priority),
		TimeEstimate: timeEstimateDays,
	}

	// Validate priority
	if finalSuggestion.Priority != "low" && finalSuggestion.Priority != "medium" && finalSuggestion.Priority != "high" {
		log.Printf("[AI] Invalid priority: %s", finalSuggestion.Priority)
		http.Error(w, "Invalid priority value", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(map[string]interface{}{
		"suggestions": finalSuggestion,
	}); err != nil {
		log.Printf("[AI] Response write error: %v", err)
	}
}

func extractJSON(input string) (string, error) {
	// Look for ```json and ``` markers
	startMarker := "```json"
	endMarker := "```"

	startIdx := strings.Index(input, startMarker)
	if startIdx == -1 {
		// Try without 'json' qualifier
		startMarker = "```"
		startIdx = strings.Index(input, startMarker)
		if startIdx == -1 {
			// No markers found, assume entire string is JSON
			return strings.TrimSpace(input), nil
		}
	} else {
		// Skip past the 'json' part
		startIdx += len(startMarker)
	}

	// Find ending marker after the start marker
	endIdx := strings.Index(input[startIdx:], endMarker)
	if endIdx == -1 {
		return "", fmt.Errorf("unclosed JSON block")
	}

	// Extract the JSON content
	jsonContent := input[startIdx : startIdx+endIdx]

	// Clean up any remaining whitespace or line breaks
	jsonContent = strings.TrimSpace(jsonContent)

	// Handle cases where Gemini might add comments after the JSON
	if strings.HasPrefix(jsonContent, "{") && strings.Contains(jsonContent, "}") {
		endBraceIdx := strings.LastIndex(jsonContent, "}")
		jsonContent = jsonContent[:endBraceIdx+1]
	}

	return jsonContent, nil
}
