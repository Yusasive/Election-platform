"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useApi, useApiMutation } from "@/hooks/useApi";
import { formatTime } from "@/lib/utils";

interface TimeSettings {
  votingStartTime: string;
  votingEndTime: string;
  loginDuration: number;
  isVotingActive: boolean;
}

export default function TimeManagement() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [localSettings, setLocalSettings] = useState<TimeSettings>({
    votingStartTime: "",
    votingEndTime: "",
    loginDuration: 35,
    isVotingActive: false,
  });

  // Fetch current settings
  const { data: settingsData, loading: settingsLoading, refetch } = useApi<{
    success: boolean;
    settings: TimeSettings;
  }>('/settings');

  // Update settings mutation
  const { mutate: updateSettings, loading: updating } = useApiMutation('/settings');

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Load settings when data is available
  useEffect(() => {
    if (settingsData?.settings) {
      const settings = settingsData.settings;
      setLocalSettings({
        votingStartTime: new Date(settings.votingStartTime).toISOString().slice(0, 16),
        votingEndTime: new Date(settings.votingEndTime).toISOString().slice(0, 16),
        loginDuration: settings.loginDuration,
        isVotingActive: settings.isVotingActive,
      });
    }
  }, [settingsData]);

  const saveTimeSettings = async () => {
    try {
      await updateSettings({
        method: 'PUT',
      }, {
        votingStartTime: new Date(localSettings.votingStartTime).toISOString(),
        votingEndTime: new Date(localSettings.votingEndTime).toISOString(),
        loginDuration: localSettings.loginDuration,
        isVotingActive: localSettings.isVotingActive,
      });
      
      alert("Time settings saved successfully!");
      refetch(); // Refresh the data
    } catch (error: any) {
      alert(error.response?.data?.error || "Failed to save settings");
    }
  };

  const toggleVoting = async () => {
    const newSettings = {
      ...localSettings,
      isVotingActive: !localSettings.isVotingActive,
    };
    
    try {
      await updateSettings({
        method: 'PUT',
      }, {
        votingStartTime: new Date(newSettings.votingStartTime).toISOString(),
        votingEndTime: new Date(newSettings.votingEndTime).toISOString(),
        loginDuration: newSettings.loginDuration,
        isVotingActive: newSettings.isVotingActive,
      });
      
      setLocalSettings(newSettings);
      refetch(); // Refresh the data
    } catch (error: any) {
      alert(error.response?.data?.error || "Failed to toggle voting");
    }
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleString();
  };

  const getVotingStatus = () => {
    if (!localSettings.votingStartTime || !localSettings.votingEndTime) {
      return { status: "Not configured", color: "gray" };
    }

    const now = currentTime.getTime();
    const start = new Date(localSettings.votingStartTime).getTime();
    const end = new Date(localSettings.votingEndTime).getTime();

    if (!localSettings.isVotingActive) {
      return { status: "Manually Disabled", color: "red" };
    }

    if (now < start) {
      return { status: "Scheduled", color: "yellow" };
    } else if (now >= start && now <= end) {
      return { status: "Active", color: "green" };
    } else {
      return { status: "Ended", color: "red" };
    }
  };

  const getTimeRemaining = () => {
    if (!localSettings.votingStartTime || !localSettings.votingEndTime) {
      return "Not configured";
    }

    const now = currentTime.getTime();
    const start = new Date(localSettings.votingStartTime).getTime();
    const end = new Date(localSettings.votingEndTime).getTime();

    let targetTime;
    let prefix;

    if (now < start) {
      targetTime = start;
      prefix = "Starts in: ";
    } else if (now >= start && now <= end) {
      targetTime = end;
      prefix = "Ends in: ";
    } else {
      return "Voting has ended";
    }

    const diff = targetTime - now;
    return `${prefix}${formatTime(diff)}`;
  };

  const votingStatus = getVotingStatus();

  if (settingsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          ⏰ Time Management
        </h2>

        {/* Current Status */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-8 border border-blue-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Current Status
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-mono text-gray-800 bg-white rounded-lg p-3 shadow-sm">
                {currentTime.toLocaleTimeString()}
              </div>
              <div className="text-sm text-gray-600 mt-2">Current Time</div>
            </div>
            <div className="text-center">
              <div
                className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium shadow-sm ${
                  votingStatus.color === "green"
                    ? "bg-green-100 text-green-800 border border-green-200"
                    : votingStatus.color === "yellow"
                    ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
                    : votingStatus.color === "red"
                    ? "bg-red-100 text-red-800 border border-red-200"
                    : "bg-gray-100 text-gray-800 border border-gray-200"
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full mr-2 ${
                    votingStatus.color === "green"
                      ? "bg-green-500 animate-pulse"
                      : votingStatus.color === "yellow"
                      ? "bg-yellow-500"
                      : votingStatus.color === "red"
                      ? "bg-red-500"
                      : "bg-gray-500"
                  }`}
                ></div>
                {votingStatus.status}
              </div>
              <div className="text-sm text-gray-600 mt-2">Voting Status</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-800 bg-white rounded-lg p-3 shadow-sm">
                {getTimeRemaining()}
              </div>
              <div className="text-sm text-gray-600 mt-2">Time Remaining</div>
            </div>
          </div>
        </div>

        {/* Emergency Controls */}
        <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-red-800 mb-4 flex items-center">
            <span className="mr-2">🚨</span>
            Emergency Controls
          </h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-700 font-medium">
                Manual Voting Control
              </p>
              <p className="text-red-600 text-sm">
                Override scheduled times to enable/disable voting immediately
              </p>
            </div>
            <button
              onClick={toggleVoting}
              disabled={updating}
              className={`px-6 py-3 rounded-lg font-semibold transition duration-200 shadow-lg ${
                localSettings.isVotingActive
                  ? "bg-red-500 text-white hover:bg-red-600"
                  : "bg-green-500 text-white hover:bg-green-600"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {updating ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Updating...</span>
                </div>
              ) : (
                localSettings.isVotingActive ? "Disable Voting" : "Enable Voting"
              )}
            </button>
          </div>
        </div>

        {/* Time Configuration */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-6 border border-blue-100"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <span className="mr-2">📅</span>
              Voting Schedule
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Voting Start Time
                </label>
                <input
                  type="datetime-local"
                  value={localSettings.votingStartTime}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      votingStartTime: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Current: {formatDateTime(localSettings.votingStartTime)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Voting End Time
                </label>
                <input
                  type="datetime-local"
                  value={localSettings.votingEndTime}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      votingEndTime: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Current: {formatDateTime(localSettings.votingEndTime)}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6 border border-green-100"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <span className="mr-2">⚙️</span>
              Session Settings
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Login Session Duration (minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={localSettings.loginDuration}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      loginDuration: parseInt(e.target.value) || 35,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white"
                />
                <p className="text-xs text-gray-500 mt-1">
                  How long users stay logged in after login
                </p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-green-200">
                <h4 className="font-medium text-gray-800 mb-3 flex items-center">
                  <span className="mr-2">⚡</span>
                  Quick Time Presets
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      const now = new Date();
                      const start = new Date(now.getTime() + 5 * 60 * 1000);
                      const end = new Date(now.getTime() + 2 * 60 * 60 * 1000);
                      setLocalSettings({
                        ...localSettings,
                        votingStartTime: start.toISOString().slice(0, 16),
                        votingEndTime: end.toISOString().slice(0, 16),
                      });
                    }}
                    className="bg-blue-500 text-white px-3 py-2 rounded text-sm hover:bg-blue-600 transition duration-200"
                  >
                    Start in 5min
                  </button>
                  <button
                    onClick={() => {
                      const now = new Date();
                      const start = new Date(now);
                      const end = new Date(now.getTime() + 60 * 60 * 1000);
                      setLocalSettings({
                        ...localSettings,
                        votingStartTime: start.toISOString().slice(0, 16),
                        votingEndTime: end.toISOString().slice(0, 16),
                      });
                    }}
                    className="bg-green-500 text-white px-3 py-2 rounded text-sm hover:bg-green-600 transition duration-200"
                  >
                    Start Now
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="flex justify-center mt-8">
          <button
            onClick={saveTimeSettings}
            disabled={updating}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-700 transition duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {updating ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Saving...</span>
              </div>
            ) : (
              "Save Time Settings"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}