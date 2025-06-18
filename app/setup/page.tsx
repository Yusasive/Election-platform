"use client";

import { useState } from "react";
import { motion } from "framer-motion";

export default function SetupPage() {
  const [seeding, setSeeding] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const seedDatabase = async () => {
    setSeeding(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch('/api/seed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setMessage("Database seeded successfully! You can now use the application.");
      } else {
        setError(data.error || "Failed to seed database");
      }
    } catch (error) {
      setError("Network error occurred while seeding database");
    } finally {
      setSeeding(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl text-white">⚙️</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Database Setup
          </h1>
          <p className="text-gray-600">
            Initialize the election platform with default data
          </p>
        </div>

        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">What this will do:</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Create default election positions</li>
              <li>• Add sample candidates</li>
              <li>• Set up election settings</li>
              <li>• Initialize the database</li>
            </ul>
          </div>

          {message && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-700 font-medium">{message}</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          )}

          <button
            onClick={seedDatabase}
            disabled={seeding}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {seeding ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Setting up database...</span>
              </div>
            ) : (
              "Initialize Database"
            )}
          </button>

          <div className="text-center">
            <a
              href="/"
              className="text-blue-500 hover:text-blue-600 text-sm font-medium"
            >
              ← Back to Home
            </a>
          </div>
        </div>
      </motion.div>
    </main>
  );
}