// src/app/(dashboard)/dashboard/task/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getTask, updateTask, deleteTask, Task } from "@/app/utils/api";
import {
  Loader2,
  Clock,
  CheckCircle,
  AlertCircle,
  Circle,
  Calendar,
  User,
  Flag,
  Trash,
  Edit,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

export default function TaskDetails({ params }: { params: { id: string } }) {
  const router = useRouter();
  const taskId = parseInt(params.id, 10);

  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTask = async () => {
      try {
        setLoading(true);
        const taskData = await getTask(taskId);
        setTask(taskData);
      } catch (err) {
        setError("Failed to fetch task");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTask();
  }, [taskId]);

  const handleStatusChange = async (newStatus: string) => {
    if (!task) return;

    try {
      await updateTask(taskId, { status: newStatus });
      setTask({ ...task, status: newStatus });
    } catch (err) {
      setError("Failed to update task status");
      console.error(err);
    }
  };

  const handleDeleteTask = async () => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      try {
        await deleteTask(taskId);
        router.push("/dashboard");
      } catch (err) {
        setError("Failed to delete task");
        console.error(err);
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <span className="flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
            <CheckCircle className="w-4 h-4 mr-1" />
            Completed
          </span>
        );
      case "in_progress":
        return (
          <span className="flex items-center bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
            <Clock className="w-4 h-4 mr-1" />
            In Progress
          </span>
        );
      case "blocked":
        return (
          <span className="flex items-center bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
            <AlertCircle className="w-4 h-4 mr-1" />
            Blocked
          </span>
        );
      default:
        return (
          <span className="flex items-center bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">
            <Circle className="w-4 h-4 mr-1" />
            To Do
          </span>
        );
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return (
          <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
            High
          </span>
        );
      case "medium":
        return (
          <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
            Medium
          </span>
        );
      case "low":
        return (
          <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
            Low
          </span>
        );
      default:
        return (
          <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">
            {priority}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="p-6 bg-red-100 text-red-700 rounded-md">
        {error || "Task not found"}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="flex items-center text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Tasks
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-2xl font-bold text-gray-800">{task.title}</h1>
          <div className="flex space-x-2">
            <Link
              href={`/dashboard/edit/${task.id}`}
              className="p-2 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200"
            >
              <Edit className="w-5 h-5" />
            </Link>
            <button
              onClick={handleDeleteTask}
              className="p-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200"
            >
              <Trash className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {getStatusBadge(task.status)}
          {getPriorityBadge(task.priority)}
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-medium text-gray-800 mb-2">
            Description
          </h2>
          <div className="bg-gray-50 p-4 rounded-md whitespace-pre-wrap">
            {task.description}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="flex items-center">
            <Calendar className="w-5 h-5 text-gray-500 mr-2" />
            <div>
              <p className="text-sm text-gray-500">Due Date</p>
              <p className="font-medium">
                {task.due_date
                  ? new Date(task.due_date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "No due date"}
              </p>
            </div>
          </div>

          <div className="flex items-center">
            <User className="w-5 h-5 text-gray-500 mr-2" />
            <div>
              <p className="text-sm text-gray-500">Assigned To</p>
              <p className="font-medium">
                {task.assigned_to
                  ? `User ID: ${task.assigned_to}`
                  : "Unassigned"}
              </p>
            </div>
          </div>

          <div className="flex items-center">
            <Flag className="w-5 h-5 text-gray-500 mr-2" />
            <div>
              <p className="text-sm text-gray-500">Created By</p>
              <p className="font-medium">User ID: {task.created_by}</p>
            </div>
          </div>

          <div className="flex items-center">
            <Clock className="w-5 h-5 text-gray-500 mr-2" />
            <div>
              <p className="text-sm text-gray-500">Created At</p>
              <p className="font-medium">
                {new Date(task.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <h2 className="text-lg font-medium text-gray-800 mb-3">
            Update Status
          </h2>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleStatusChange("todo")}
              className={`flex items-center px-4 py-2 rounded-md ${
                task.status === "todo"
                  ? "bg-gray-200 text-gray-800"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <Circle className="w-4 h-4 mr-2" />
              To Do
            </button>
            <button
              onClick={() => handleStatusChange("in_progress")}
              className={`flex items-center px-4 py-2 rounded-md ${
                task.status === "in_progress"
                  ? "bg-yellow-200 text-yellow-800"
                  : "bg-yellow-50 text-yellow-600 hover:bg-yellow-100"
              }`}
            >
              <Clock className="w-4 h-4 mr-2" />
              In Progress
            </button>
            <button
              onClick={() => handleStatusChange("completed")}
              className={`flex items-center px-4 py-2 rounded-md ${
                task.status === "completed"
                  ? "bg-green-200 text-green-800"
                  : "bg-green-50 text-green-600 hover:bg-green-100"
              }`}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Completed
            </button>
            <button
              onClick={() => handleStatusChange("blocked")}
              className={`flex items-center px-4 py-2 rounded-md ${
                task.status === "blocked"
                  ? "bg-red-200 text-red-800"
                  : "bg-red-50 text-red-600 hover:bg-red-100"
              }`}
            >
              <AlertCircle className="w-4 h-4 mr-2" />
              Blocked
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
