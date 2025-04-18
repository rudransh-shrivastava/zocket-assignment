"use client";

import { useState, useEffect } from "react";
import {
  fetchTasks,
  deleteTask,
  updateTask,
  createTask,
  Task,
  trimDateString,
  fetchAiSuggestion,
} from "@/app/utils/api";
import {
  CheckCircle,
  Clock,
  AlertCircle,
  Circle,
  Trash,
  Edit,
  ExternalLink,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [showChat, setShowChat] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [aiMessages, setAiMessages] = useState<
    Array<{ role: string; content: string }>
  >([]);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    loadTasks();
  }, []);

  const handleGenerateTasks = async () => {
    if (!prompt.trim()) {
      setError("Please enter a task description");
      return;
    }

    setIsGenerating(true);
    try {
      // Call AI suggestion endpoint
      const suggestions = await fetchAiSuggestion(prompt);

      if (!suggestions) {
        throw new Error("AI suggestion failed");
      }

      // Create tasks from suggestions
      await Promise.all(
        suggestions.subtasks.map((subtask: string) =>
          createTask({
            title: subtask,
            description: `Part of: ${suggestions.title}`,
            status: "todo",
            priority: suggestions.priority,
            due_date: new Date(
              Date.now() + suggestions.time_estimate * 24 * 60 * 60 * 1000,
            ).toISOString(),
          }),
        ),
      );

      setAiMessages([]);
      setPrompt("");
      setShowChat(false);
      loadTasks();
    } catch (err) {
      setError("Failed to generate tasks");
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const loadTasks = async () => {
    try {
      setLoading(true);
      const taskData = await fetchTasks();
      setTasks(taskData);
      setError(null);
    } catch (err) {
      setError("Failed to load tasks");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      try {
        await deleteTask(id);
        setTasks(tasks.filter((task) => task.id !== id));
      } catch (err) {
        setError("Failed to delete task");
        console.error(err);
      }
    }
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      await updateTask(id, { status: newStatus });
      setTasks(
        tasks.map((task) =>
          task.id === id ? { ...task, status: newStatus } : task,
        ),
      );
    } catch (err) {
      setError("Failed to update task status");
      console.error(err);
    }
  };

  const filteredTasks =
    filter === "all" ? tasks : tasks.filter((task) => task.status === filter);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        Loading tasks...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Tasks</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowChat(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center gap-2"
          >
            <MessageSquare size={18} />
            Generate Tasks
          </button>
          <Link
            href="/dashboard/create"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Create New Task
          </Link>
        </div>
      </div>

      {/* AI Chat Modal */}
      {showChat && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl text-gray-700 font-semibold">
                Generate Tasks with AI
              </h2>
              <button
                onClick={() => setShowChat(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                &times;
              </button>
            </div>

            <div className="mb-4 h-64 overflow-y-auto bg-gray-50 p-4 rounded">
              {aiMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`mb-3 p-3 rounded ${
                    msg.role === "user" ? "bg-blue-100" : "bg-gray-100"
                  }`}
                >
                  {msg.content}
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the task you want to generate..."
                className="flex-1 text-gray-700 p-2 border rounded"
                disabled={isGenerating}
              />
              <button
                onClick={handleGenerateTasks}
                disabled={isGenerating}
                className={`px-4 py-2 text-white rounded ${
                  isGenerating
                    ? "bg-gray-400"
                    : "bg-purple-600 hover:bg-purple-700"
                }`}
              >
                {isGenerating ? "Generating..." : "Send"}
              </button>
            </div>
          </div>
        </div>
      )}
      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded-md">{error}</div>
      )}
      <div className="flex space-x-2 mb-4">
        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1 rounded-md ${
            filter === "all"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter("todo")}
          className={`px-3 py-1 rounded-md ${
            filter === "todo"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          To Do
        </button>
        <button
          onClick={() => setFilter("in_progress")}
          className={`px-3 py-1 rounded-md ${
            filter === "in_progress"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          In Progress
        </button>
        <button
          onClick={() => setFilter("completed")}
          className={`px-3 py-1 rounded-md ${
            filter === "completed"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Completed
        </button>
        <button
          onClick={() => setFilter("blocked")}
          className={`px-3 py-1 rounded-md ${
            filter === "blocked"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Blocked
        </button>
      </div>

      {filteredTasks.length === 0 ? (
        <div
          className="p-6 text-center text-gray-500 bg-white rounded-md shadow"
          key={0}
        >
          No tasks found. Create a new task to get started!
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              className="p-4 bg-white rounded-lg shadow-md border-l-4 hover:shadow-lg transition-shadow"
              style={{
                borderLeftColor:
                  task.priority === "high"
                    ? "#f87171"
                    : task.priority === "medium"
                      ? "#fbbf24"
                      : "#34d399",
              }}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold text-gray-800 truncate">
                  {task.title}
                </h3>
                <div className="flex space-x-2">
                  <Link href={`/dashboard/task/${task.id}`}>
                    <ExternalLink className="w-5 h-5 text-blue-500 cursor-pointer" />
                  </Link>
                  <Link href={`/dashboard/edit/${task.id}`}>
                    <Edit className="w-5 h-5 text-gray-500 cursor-pointer" />
                  </Link>
                  <button onClick={() => handleDeleteTask(task.id)}>
                    <Trash className="w-5 h-5 text-red-500 cursor-pointer" />
                  </button>
                </div>
              </div>

              <p className="text-gray-600 mb-4 line-clamp-2">
                {task.description}
              </p>

              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="text-sm text-gray-500">
                  <span className="font-medium">Due:</span>{" "}
                  {task.due_date
                    ? new Date(task.due_date).toLocaleDateString()
                    : "No date"}
                </div>
                <div className="text-sm text-gray-500">
                  <span className="font-medium">Created:</span>{" "}
                  {new Date(trimDateString(task.created_at)).toString()}
                </div>
                )
              </div>

              <div className="flex justify-between items-center">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(
                    task.priority,
                  )}`}
                >
                  {task.priority.charAt(0).toUpperCase() +
                    task.priority.slice(1)}
                </span>

                <div className="flex space-x-1">
                  <button
                    onClick={() => handleStatusChange(task.id, "todo")}
                    className={`p-1 rounded-full ${
                      task.status === "todo"
                        ? "bg-gray-200"
                        : "hover:bg-gray-100"
                    }`}
                    title="To Do"
                  >
                    <Circle className="w-4 h-4 text-gray-400" />
                  </button>
                  <button
                    onClick={() => handleStatusChange(task.id, "in_progress")}
                    className={`p-1 rounded-full ${
                      task.status === "in_progress"
                        ? "bg-yellow-100"
                        : "hover:bg-gray-100"
                    }`}
                    title="In Progress"
                  >
                    <Clock className="w-4 h-4 text-yellow-500" />
                  </button>
                  <button
                    onClick={() => handleStatusChange(task.id, "completed")}
                    className={`p-1 rounded-full ${
                      task.status === "completed"
                        ? "bg-green-100"
                        : "hover:bg-gray-100"
                    }`}
                    title="Completed"
                  >
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  </button>
                  <button
                    onClick={() => handleStatusChange(task.id, "blocked")}
                    className={`p-1 rounded-full ${
                      task.status === "blocked"
                        ? "bg-red-100"
                        : "hover:bg-gray-100"
                    }`}
                    title="Blocked"
                  >
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
