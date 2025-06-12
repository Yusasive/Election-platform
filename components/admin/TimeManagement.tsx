"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface TimeSettings {
  votingStartTime: string;
  votingEndTime: string;
  loginDuration: number; // in minutes
  isVotingActive: boolean;
}

export default function TimeManagement() {
  const [timeSettings, setTimeSettings] = useState<TimeSettings>({
    votingStartTime: "",
    votingEndTime: "",
    loginDuration: 35, // 5 * 7 minutes default
    isVotingActive: false,
  });
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Load existing settings
    const savedSettings = localStorage.getItem("timeSettings");
    if (savedSettings) {
      setTimeSettings(JSON.parse(savedSettings));
    } else {
      // Set default times
      const now = new Date();
      const startTime = new Date(now);
      startTime.setHours(6, 0, 0, 0);
      const endTime = new Date(now);
      endTime.setHours(20, 0, 0, 0);

      setTimeSettings({
        votingStartTime: startTime.toISOString().slice(0, 16),
        votingEndTime: endTime.toISOString().slice(0, 16),
        loginDuration: 35,
        isVotingActive: false,
      });
    }

    // Update current time every second
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const saveTimeSettings = () => {
    localStorage.setItem("timeSettings", JSON.stringify(timeSettings));
    alert("Time settings saved successfully!");
  };

  const toggleVoting = () => {
    const newSettings = {
      ...timeSettings,
      isVotingActive: !timeSettings.isVotingActive,
    };
    setTimeSettings(newSettings);
    localStorage.setItem("timeSettings", JSON.stringify(newSettings));
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleString();
  };

  const getVotingStatus = () => {
    if (!timeSettings.votingStartTime || !timeSettings.votingEndTime) {
      return { status: "Not configured", color: "gray" };
    }

    const now = currentTime.getTime();
    const start = new Date(timeSettings.votingStartTime).getTime();
    const end = new Date(timeSettings.votingEndTime).getTime();

    if (!timeSettings.isVotingActive) {
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
    if (!timeSettings.votingStartTime || !timeSettings.votingEndTime) {
      return "Not configured";
    }

    const now = currentTime.getTime();
    const start = new Date(timeSettings.votingStartTime).getTime();
    const end = new Date(timeSettings.votingEndTime).getTime();

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
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return `${prefix}${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const votingStatus = getVotingStatus();

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          ⏰ Time Management
        </h2>

        {/* Current Status */}
        <div className="bg-gray-50 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Current Status
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-mono text-gray-800">
                {currentTime.toLocaleTimeString()}
              </div>
              <div className="text-sm text-gray-600">Current Time</div>
            </div>
            <div className="text-center">
              <div
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  votingStatus.color === "green"
                    ? "bg-green-100 text-green-800"
                    : votingStatus.color === "yellow"
                    ? "bg-yellow-100 text-yellow-800"
                    : votingStatus.color === "red"
                    ? "bg-red-100 text-red-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full mr-2 ${
                    votingStatus.color === "green"
                      ? "bg-green-500"
                      : votingStatus.color === "yellow"
                      ? "bg-yellow-500"
                      : votingStatus.color === "red"
                      ? "bg-red-500"
                      : "bg-gray-500"
                  }`}
                ></div>
                {votingStatus.status}
              </div>
              <div className="text-sm text-gray-600 mt-1">Voting Status</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-800">
                {getTimeRemaining()}
              </div>
              <div className="text-sm text-gray-600">Time Remaining</div>
            </div>
          </div>
        </div>

        {/* Emergency Controls */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-red-800 mb-4">
            🚨 Emergency Controls
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
              className={`px-6 py-3 rounded-lg font-semibold transition duration-200 ${
                timeSettings.isVotingActive
                  ? "bg-red-500 text-white hover:bg-red-600"
                  : "bg-green-500 text-white hover:bg-green-600"
              }`}
            >
              {timeSettings.isVotingActive ? "Disable Voting" : "Enable Voting"}
            </button>
          </div>
        </div>

        {/* Time Configuration */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-blue-50 rounded-lg p-6"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Voting Schedule
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Voting Start Time
                </label>
                <input
                  type="datetime-local"
                  value={timeSettings.votingStartTime}
                  onChange={(e) =>
                    setTimeSettings({
                      ...timeSettings,
                      votingStartTime: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Current: {formatDateTime(timeSettings.votingStartTime)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Voting End Time
                </label>
                <input
                  type="datetime-local"
                  value={timeSettings.votingEndTime}
                  onChange={(e) =>
                    setTimeSettings({
                      ...timeSettings,
                      votingEndTime: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Current: {formatDateTime(timeSettings.votingEndTime)}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-green-50 rounded-lg p-6"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
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
                  value={timeSettings.loginDuration}
                  onChange={(e) =>
                    setTimeSettings({
                      ...timeSettings,
                      loginDuration: parseInt(e.target.value) || 35,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  How long users stay logged in after login
                </p>
              </div>
              <div className="bg-white rounded-lg p-4 border">
                <h4 className="font-medium text-gray-800 mb-2">
                  Quick Time Presets
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      const now = new Date();
                      const start = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes from now
                      const end = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours from now
                      setTimeSettings({
                        ...timeSettings,
                        votingStartTime: start.toISOString().slice(0, 16),
                        votingEndTime: end.toISOString().slice(0, 16),
                      });
                    }}
                    className="bg-blue-500 text-white px-3 py-2 rounded text-sm hover:bg-blue-600"
                  >
                    Start in 5min
                  </button>
                  <button
                    onClick={() => {
                      const now = new Date();
                      const start = new Date(now);
                      const end = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
                      setTimeSettings({
                        ...timeSettings,
                        votingStartTime: start.toISOString().slice(0, 16),
                        votingEndTime: end.toISOString().slice(0, 16),
                      });
                    }}
                    className="bg-green-500 text-white px-3 py-2 rounded text-sm hover:bg-green-600"
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
            className="bg-blue-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-600 transition duration-200"
          >
            Save Time Settings
          </button>
        </div>
      </div>
    </div>
  );
}