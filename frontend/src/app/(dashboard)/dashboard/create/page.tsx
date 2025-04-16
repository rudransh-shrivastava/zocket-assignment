// src/app/(dashboard)/dashboard/create/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createTask,
  getAISuggestions,
  AISuggestion,
  TaskInput,
} from "@/app/utils/api";
import { Loader2 } from "lucide-react";

export default function CreateTask() {
  const router = useRouter();
  const [task, setTask] = useState<TaskInput>({
    title: "",
    description: "",
    status: "todo",
    priority: "medium",
    due_date: "",
  });
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiSuggestion, setAiSuggestion] = useState<AISuggestion | null>(null);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setTask((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await createTask(task);
      router.push("/dashboard");
    } catch (err) {
      setError("Failed to create task");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGetAISuggestions = async () => {
    if (!task.description) {
      setError("Please provide a task description to get AI suggestions");
      return;
    }

    try {
      setAiLoading(true);
      setError(null);
      const suggestions = await getAISuggestions(task.description);
      setAiSuggestion(suggestions);

      // Update task with AI suggestions
      if (suggestions.title) {
        setTask((prev) => ({
          ...prev,
          title: suggestions.title || prev.title,
          priority: suggestions.priority.toLowerCase() || prev.priority,
        }));
      }
    } catch (err) {
      setError("Failed to get AI suggestions");
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  };

  const applySubtask = (subtask: string) => {
    setTask((prev) => ({
      ...prev,
      description: prev.description + "\n\n- " + subtask,
    }));
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Create New Task</h1>

      {error && (
        <div className="p-4 mb-4 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title
          </label>
          <input
            type="text"
            name="title"
            value={task.title}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            name="description"
            value={task.description}
            onChange={handleChange}
            rows={5}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          ></textarea>
          <button
            type="button"
            onClick={handleGetAISuggestions}
            disabled={aiLoading || !task.description}
            className="mt-2 inline-flex items-center px-3 py-1 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-purple-300"
          >
            {aiLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Getting suggestions...
              </>
            ) : (
              "Get AI Suggestions"
            )}
          </button>
        </div>

        {aiSuggestion && (
          <div className="bg-purple-50 p-4 rounded-md border border-purple-200">
            <h3 className="text-lg font-medium text-purple-800 mb-2">
              AI Suggestions
            </h3>
            {aiSuggestion.title && (
              <div className="mb-2">
                <p className="text-sm text-purple-700">
                  <span className="font-medium">Title:</span>{" "}
                  {aiSuggestion.title}
                </p>
              </div>
            )}
            {aiSuggestion.priority && (
              <div className="mb-2">
                <p className="text-sm text-purple-700">
                  <span className="font-medium">Recommended Priority:</span>{" "}
                  {aiSuggestion.priority}
                </p>
              </div>
            )}
            {aiSuggestion.timeEstimate && (
              <div className="mb-2">
                <p className="text-sm text-purple-700">
                  <span className="font-medium">Time Estimate:</span>{" "}
                  {aiSuggestion.timeEstimate}
                </p>
              </div>
            )}
            {aiSuggestion.subtasks && aiSuggestion.subtasks.length > 0 && (
              <div>
                <p className="text-sm font-medium text-purple-700 mb-1">
                  Suggested Subtasks:
                </p>
                <div className="space-y-1">
                  {aiSuggestion.subtasks.map((subtask, index) => (
                    <div key={index} className="flex items-center">
                      <button
                        type="button"
                        onClick={() => applySubtask(subtask)}
                        className="text-xs px-2 py-1 bg-purple-100 hover:bg-purple-200 text-purple-800 rounded mr-2"
                      >
                        Add
                      </button>
                      <span className="text-sm text-gray-700">{subtask}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              name="status"
              value={task.status}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              name="priority"
              value={task.priority}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Due Date
            </label>
            <input
              type="date"
              name="due_date"
              value={task.due_date}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
          >
            {loading ? (
              <span className="flex items-center">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </span>
            ) : (
              "Create Task"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
