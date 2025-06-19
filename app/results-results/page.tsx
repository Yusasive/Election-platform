"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useApi } from "@/hooks/useApi";
import Image from "next/image";

interface CandidateResult {
  id: number;
  name: string;
  nickname?: string;
  department?: string;
  level?: string;
  votes: number;
  percentage: number;
}

interface PositionResult {
  position: string;
  allowMultiple: boolean;
  totalVotes: number;
  candidates: CandidateResult[];
  winner: CandidateResult | null;
}

interface ElectionResults {
  positions: PositionResult[];
  statistics: {
    totalVoters: number;
    totalCandidates: number;
    totalPositions: number;
    departmentStats: { [key: string]: number };
    hourlyVotes: { [key: string]: number };
  };
  lastUpdated: string;
}

export default function ResultsPage() {
  const [selectedPosition, setSelectedPosition] = useState<string>("all");

  // Fetch results from database
  const { data: resultsData, loading, error, refetch } = useApi<{
    success: boolean;
    results: ElectionResults;
  }>('/results', {
    immediate: true,
    retries: 3,
    onError: (error) => {
      console.error("Results fetch error:", error);
    }
  });

  const results = resultsData?.results;

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 30000);

    return () => clearInterval(interval);
  }, [refetch]);

  const getPositionColor = (index: number) => {
    const colors = [
      "from-blue-500 to-blue-600",
      "from-green-500 to-green-600", 
      "from-purple-500 to-purple-600",
      "from-orange-500 to-orange-600",
      "from-red-500 to-red-600",
      "from-indigo-500 to-indigo-600",
    ];
    return colors[index % colors.length];
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return "🥇";
      case 2: return "🥈";
      case 3: return "🥉";
      default: return `${rank}th`;
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center bg-white rounded-2xl shadow-lg p-8"
        >
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading election results...</p>
          <p className="text-sm text-gray-500 mt-2">Please wait while we compile the data</p>
        </motion.div>
      </main>
    );
  }

  if (error || !results) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center bg-white rounded-2xl shadow-lg p-8 max-w-md mx-4"
        >
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Failed to Load Results</h2>
          <p className="text-gray-600 mb-4">We couldn't load the election results.</p>
          
          <div className="space-y-3">
            <button
              onClick={() => refetch()}
              className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition duration-200"
            >
              Try Again
            </button>
            
            <button
              onClick={() => window.location.href = "/"}
              className="w-full bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition duration-200"
            >
              Return to Home
            </button>
          </div>
        </motion.div>
      </main>
    );
  }

  const filteredPositions = selectedPosition === "all" 
    ? results.positions 
    : results.positions.filter(p => p.position === selectedPosition);

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-800 mb-4">
            🏆 Election Results
          </h1>
          <p className="text-lg text-gray-600 mb-2">
            Faculty of Physical Sciences
          </p>
          <p className="text-sm text-gray-500">
            Last updated: {new Date(results.lastUpdated).toLocaleString()}
          </p>
        </motion.header>

        {/* Statistics Overview */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {results.statistics.totalVoters}
            </div>
            <div className="text-gray-600 font-medium">Total Voters</div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {results.statistics.totalPositions}
            </div>
            <div className="text-gray-600 font-medium">Positions</div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {results.statistics.totalCandidates}
            </div>
            <div className="text-gray-600 font-medium">Candidates</div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-orange-600 mb-2">
              {Object.keys(results.statistics.departmentStats).length}
            </div>
            <div className="text-gray-600 font-medium">Departments</div>
          </div>
        </motion.section>

        {/* Position Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-lg p-6 mb-8"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-gray-800">Filter by Position</h2>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedPosition("all")}
                className={`px-4 py-2 rounded-lg font-medium transition duration-200 ${
                  selectedPosition === "all"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                All Positions
              </button>
              {results.positions.map((position) => (
                <button
                  key={position.position}
                  onClick={() => setSelectedPosition(position.position)}
                  className={`px-4 py-2 rounded-lg font-medium transition duration-200 ${
                    selectedPosition === position.position
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {position.position}
                </button>
              ))}
            </div>
            <button
              onClick={() => refetch()}
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition duration-200"
            >
              Refresh Results
            </button>
          </div>
        </motion.div>

        {/* Results */}
        <div className="space-y-8">
          {filteredPositions.map((position, positionIndex) => (
            <motion.div
              key={position.position}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + positionIndex * 0.1 }}
              className="bg-white rounded-xl shadow-lg overflow-hidden"
            >
              {/* Position Header */}
              <div className={`bg-gradient-to-r ${getPositionColor(positionIndex)} text-white p-6`}>
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-2xl font-bold mb-2">{position.position}</h3>
                    <p className="text-white/90">
                      {position.allowMultiple ? "Multiple selections allowed" : "Single selection only"} • 
                      {position.totalVotes} total votes
                    </p>
                  </div>
                  {position.winner && (
                    <div className="text-center">
                      <div className="text-4xl mb-2">👑</div>
                      <div className="text-sm font-medium">Winner</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Candidates Results */}
              <div className="p-6">
                {position.candidates.length > 0 ? (
                  <div className="space-y-4">
                    {position.candidates.map((candidate, candidateIndex) => (
                      <motion.div
                        key={candidate.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + candidateIndex * 0.1 }}
                        className={`p-4 rounded-lg border-2 transition duration-200 ${
                          candidateIndex === 0 && position.candidates.length > 1
                            ? "border-yellow-400 bg-yellow-50"
                            : "border-gray-200 bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            {/* Rank */}
                            <div className="text-2xl font-bold">
                              {getRankIcon(candidateIndex + 1)}
                            </div>
                            
                            {/* Candidate Info */}
                            <div>
                              <h4 className="text-lg font-bold text-gray-800">
                                {candidate.name}
                              </h4>
                              {candidate.nickname && (
                                <p className="text-blue-600 font-medium italic">
                                  "{candidate.nickname}"
                                </p>
                              )}
                              <div className="flex items-center space-x-2 text-sm text-gray-600">
                                {candidate.department && (
                                  <span>{candidate.department}</span>
                                )}
                                {candidate.level && (
                                  <>
                                    <span>•</span>
                                    <span>{candidate.level}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {/* Vote Count */}
                          <div className="text-right">
                            <div className="text-2xl font-bold text-gray-800">
                              {candidate.votes}
                            </div>
                            <div className="text-sm text-gray-600">
                              {candidate.percentage}% of votes
                            </div>
                          </div>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="mt-3">
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                              className={`h-3 rounded-full transition-all duration-500 ${
                                candidateIndex === 0 && position.candidates.length > 1
                                  ? "bg-gradient-to-r from-yellow-400 to-yellow-500"
                                  : "bg-gradient-to-r from-blue-400 to-blue-500"
                              }`}
                              style={{ width: `${candidate.percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-3">🗳️</div>
                    <p className="text-gray-500">No candidates for this position</p>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {filteredPositions.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="text-6xl mb-4">📊</div>
            <p className="text-gray-500 text-lg">No results available for the selected filter</p>
          </motion.div>
        )}

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center mt-12 py-8"
        >
          <div className="space-y-2">
            <button
              onClick={() => window.location.href = "/"}
              className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition duration-200 font-medium"
            >
              Return to Home
            </button>
            <p className="text-sm text-gray-500">
              Results are updated in real-time as votes are cast
            </p>
          </div>
        </motion.footer>
      </div>
    </main>
  );
}