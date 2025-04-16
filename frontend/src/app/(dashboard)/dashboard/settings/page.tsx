// src/app/(dashboard)/dashboard/settings/page.tsx
"use client";

import { useState } from "react";
import { Bell, Moon, Globe } from "lucide-react";

export default function SettingsPage() {
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [language, setLanguage] = useState("en");
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would save the settings to an API or localStorage
    // For now, just show a save confirmation
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Settings</h1>

      {saved && (
        <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-md">
          Settings saved successfully!
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <h2 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
              <Moon className="w-5 h-5 mr-2" />
              Appearance
            </h2>
            <div className="pl-7">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="darkMode"
                  checked={darkMode}
                  onChange={(e) => setDarkMode(e.target.checked)}
                  className="w-4 h-4 text-blue-600"
                />
                <label htmlFor="darkMode" className="ml-2 text-gray-700">
                  Dark Mode
                </label>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Enable dark mode for a better viewing experience at night
              </p>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
              <Bell className="w-5 h-5 mr-2" />
              Notifications
            </h2>
            <div className="pl-7 space-y-3">
              <div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="appNotifications"
                    checked={notifications}
                    onChange={(e) => setNotifications(e.target.checked)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <label
                    htmlFor="appNotifications"
                    className="ml-2 text-gray-700"
                  >
                    In-App Notifications
                  </label>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Receive notifications about task updates and assignments
                </p>
              </div>

              <div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="emailNotifications"
                    checked={emailNotifications}
                    onChange={(e) => setEmailNotifications(e.target.checked)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <label
                    htmlFor="emailNotifications"
                    className="ml-2 text-gray-700"
                  >
                    Email Notifications
                  </label>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Receive email notifications for important task updates
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
              <Globe className="w-5 h-5 mr-2" />
              Language and Region
            </h2>
            <div className="pl-7">
              <label className="block text-sm text-gray-700 mb-1">
                Preferred Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="ja">Japanese</option>
              </select>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6 flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
