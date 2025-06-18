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
        setMessage("Database initialized successfully! Admin can now create positions and add candidates from scratch.");
      } else {
        setError(data.error || "Failed to initialize database");
      }
    } catch (error) {
      setError("Network error occurred while initializing database");
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
            <span className="text-3xl text-white">🆕</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Fresh Database Setup
          </h1>
          <p className="text-gray-600">
            Initialize completely empty database for fresh election setup
          </p>
        </div>

        <div className="space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-800 mb-2">What this will do:</h3>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Create basic election settings only</li>
              <li>• Initialize completely empty database</li>
              <li>• No default positions or candidates</li>
              <li>• Admin creates everything from scratch</li>
            </ul>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">Fresh Start:</h3>
            <p className="text-sm text-blue-700">
              Admin will create all positions and candidates through the dashboard. No pre-existing data.
            </p>
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
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {seeding ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Initializing fresh database...</span>
              </div>
            ) : (
              "🆕 Initialize Fresh Database"
            )}
          </button>

          <div className="text-center space-y-2">
            <a
              href="/admin"
              className="block text-blue-500 hover:text-blue-600 text-sm font-medium"
            >
              Go to Admin Dashboard →
            </a>
            <a
              href="/"
              className="block text-gray-500 hover:text-gray-600 text-sm"
            >
              ← Back to Home
            </a>
          </div>
        </div>
      </motion.div>
    </main>
  );
}