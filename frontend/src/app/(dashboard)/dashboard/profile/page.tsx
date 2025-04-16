"use client";

import { useState, useEffect } from "react";
import { Loader2, User } from "lucide-react";

// Simple mock profile until we add user profile API endpoints
interface UserProfile {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
  tasks_created: number;
  tasks_assigned: number;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock profile data
    // In a real app, you would fetch this from an API
    setTimeout(() => {
      setProfile({
        id: 1,
        name: "Demo User",
        email: "user@example.com",
        role: "Developer",
        created_at: new Date().toISOString(),
        tasks_created: 12,
        tasks_assigned: 8,
      });
      setLoading(false);
    }, 700);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="bg-red-100 text-red-700 p-4 rounded-md">
        Failed to load profile
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Your Profile</h1>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="p-6">
          <div className="flex items-center">
            <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center">
              <User className="w-10 h-10 text-blue-600" />
            </div>
            <div className="ml-6">
              <h2 className="text-xl font-semibold text-gray-800">
                {profile.name}
              </h2>
              <p className="text-gray-600">{profile.role}</p>
            </div>
          </div>

          <div className="mt-8 border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-800 mb-4">
              User Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{profile.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">User ID</p>
                <p className="font-medium">{profile.id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Member Since</p>
                <p className="font-medium">
                  {new Date(profile.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-800 mb-4">
              Task Statistics
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-md">
                <p className="text-blue-700 font-medium">Tasks Created</p>
                <p className="text-2xl font-semibold text-blue-800">
                  {profile.tasks_created}
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-md">
                <p className="text-green-700 font-medium">Tasks Assigned</p>
                <p className="text-2xl font-semibold text-green-800">
                  {profile.tasks_assigned}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-medium text-gray-800 mb-4">
              Account Settings
            </h3>
            <div className="space-y-4">
              <button className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200">
                Change Password
              </button>
              <button className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200">
                Update Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
