// API utility functions for tasks
import axios from "axios";
// Task type definition
export interface Task {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  due_date: string;
  assigned_to: number;
  created_by: number;
  created_at: string;
  updated_at: string;
}

// Task input type
export interface TaskInput {
  title: string;
  description: string;
  status?: string;
  priority?: string;
  due_date?: string;
  assigned_to?: number;
}

// AI Suggestion response type
export interface AISuggestion {
  title: string;
  subtasks: string[];
  priority: string;
  timeEstimate: string;
}

// Base API URL
const API_URL = "http://localhost:8080/api";

// Get auth token from localStorage
const getToken = () => localStorage.getItem("token");

// Fetch tasks
export const fetchTasks = async (): Promise<Task[]> => {
  const token = getToken();

  if (!token) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(`${API_URL}/tasks`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch tasks");
  }

  const data = await response.json();
  return data.tasks;
};

// Get task by ID
export const getTask = async (id: number): Promise<Task> => {
  const token = getToken();

  if (!token) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(`${API_URL}/tasks/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch task");
  }

  const data = await response.json();
  return data.task;
};

// Create task
export const createTask = async (task: TaskInput): Promise<Task> => {
  const token = getToken();

  if (!token) {
    throw new Error("Not authenticated");
  }
  if (!task.due_date) {
    throw new Error("Date not selected");
  }
  task.due_date = new Date(task.due_date).toISOString();

  try {
    console.log("About to make request with payload:", JSON.stringify(task));
    const response = await axios.post(`${API_URL}/tasks`, task, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    console.log("Response data:", response);
    return response.data.task || response.data;
  } catch (error) {
    console.error("Error in request:", error);
    throw error;
  }
};

// Update task
export const updateTask = async (
  id: number,
  task: Partial<TaskInput>,
): Promise<Task> => {
  const token = getToken();

  if (!token) {
    throw new Error("Not authenticated");
  }

  if (task.due_date) {
    task.due_date = new Date(task.due_date).toISOString();
  }

  const response = await fetch(`${API_URL}/tasks/${id}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(task),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update task");
  }

  const data = await response.json();
  return data.task;
};

// Delete task
export const deleteTask = async (id: number): Promise<void> => {
  const token = getToken();

  if (!token) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(`${API_URL}/tasks/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete task");
  }
};

// Get AI suggestions
export const getAISuggestions = async (
  taskDescription: string,
): Promise<AISuggestion> => {
  const token = getToken();

  if (!token) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(`${API_URL}/ai/suggest`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ task_description: taskDescription }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to get AI suggestions");
  }

  const data = await response.json();
  return JSON.parse(data.suggestions);
};

export const trimDateString = (dateStr: string) => {
  // This regex replaces the fractional seconds if they have more than 3 digits.
  return dateStr.replace(/(\.\d{3})\d+/, "$1");
};
