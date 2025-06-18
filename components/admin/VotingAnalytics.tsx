"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useApi } from "@/hooks/useApi";

interface AnalyticsData {
  totalVotes: number;
  positionStats: {
    [position: string]: {
      totalVotes: number;
      candidates: { [candidateId: string]: number };
    };
  };
  hourlyVotes: { [hour: string]: number };
  departmentStats: { [department: string]: number };
}

export default function VotingAnalytics() {
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  // Fetch analytics from database
  const { data: analyticsData, loading, refetch } = useApi<{
    success: boolean;
    analytics: AnalyticsData;
  }>('/analytics');

  const analytics = analyticsData?.analytics || {
    totalVotes: 0,
    positionStats: {},
    hourlyVotes: {},
    departmentStats: {},
  };

  useEffect(() => {
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      refetch();
    }, 30000);
    setRefreshInterval(interval);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [refetch]);

  const getTopCandidate = (candidates: { [candidateId: string]: number }) => {
    const entries = Object.entries(candidates);
    if (entries.length === 0) return null;
    
    return entries.reduce((top, current) => 
      current[1] > top[1] ? current : top
    );
  };

  const calculatePercentage = (votes: number, total: number) => {
    return total > 0 ? ((votes / total) * 100).toFixed(1) : "0";
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            📊 Voting Analytics
          </h2>
          <button
            onClick={refetch}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition duration-200"
          >
            Refresh Data
          </button>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-50 rounded-lg p-6"
          >
            <div className="flex items-center">
              <div className="p-3 bg-blue-500 rounded-full">
                <span className="text-white text-xl">🗳️</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Votes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analytics.totalVotes}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-green-50 rounded-lg p-6"
          >
            <div className="flex items-center">
              <div className="p-3 bg-green-500 rounded-full">
                <span className="text-white text-xl">📋</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Positions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Object.keys(analytics.positionStats).length}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-purple-50 rounded-lg p-6"
          >
            <div className="flex items-center">
              <div className="p-3 bg-purple-500 rounded-full">
                <span className="text-white text-xl">🏢</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Departments</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Object.keys(analytics.departmentStats).length}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-orange-50 rounded-lg p-6"
          >
            <div className="flex items-center">
              <div className="p-3 bg-orange-500 rounded-full">
                <span className="text-white text-xl">⏱️</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Peak Hour</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Object.entries(analytics.hourlyVotes).length > 0
                    ? Object.entries(analytics.hourlyVotes).reduce((a, b) =>
                        a[1] > b[1] ? a : b
                      )[0]
                    : "N/A"}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Position Results */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            Position Results
          </h3>
          <div className="space-y-6">
            {Object.entries(analytics.positionStats).map(([position, stats]) => {
              const topCandidate = getTopCandidate(stats.candidates);
              return (
                <motion.div
                  key={position}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-gray-50 rounded-lg p-6"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-semibold text-gray-800">
                      {position}
                    </h4>
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                      {stats.totalVotes} votes
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    {Object.entries(stats.candidates)
                      .sort(([, a], [, b]) => b - a)
                      .map(([candidateId, votes]) => (
                        <div key={candidateId} className="flex items-center">
                          <div className="flex-1">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm font-medium text-gray-700">
                                Candidate {candidateId}
                              </span>
                              <span className="text-sm text-gray-600">
                                {votes} votes ({calculatePercentage(votes, stats.totalVotes)}%)
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  topCandidate && topCandidate[0] === candidateId
                                    ? "bg-green-500"
                                    : "bg-blue-500"
                                }`}
                                style={{
                                  width: `${calculatePercentage(votes, stats.totalVotes)}%`,
                                }}
                              ></div>
                            </div>
                          </div>
                          {topCandidate && topCandidate[0] === candidateId && (
                            <span className="ml-3 text-green-500 font-bold">👑</span>
                          )}
                        </div>
                      ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Department Statistics */}
        {Object.keys(analytics.departmentStats).length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Participation by Department
            </h3>
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(analytics.departmentStats)
                  .sort(([, a], [, b]) => b - a)
                  .map(([department, count]) => (
                    <div key={department} className="bg-white rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-800">
                          {department}
                        </span>
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                          {count}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Hourly Voting Pattern */}
        {Object.keys(analytics.hourlyVotes).length > 0 && (
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Voting Pattern by Hour
            </h3>
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-end space-x-2 h-32">
                {Array.from({ length: 24 }, (_, i) => {
                  const hour = `${i}:00`;
                  const votes = analytics.hourlyVotes[hour] || 0;
                  const maxVotes = Math.max(...Object.values(analytics.hourlyVotes));
                  const height = maxVotes > 0 ? (votes / maxVotes) * 100 : 0;
                  
                  return (
                    <div key={hour} className="flex-1 flex flex-col items-center">
                      <div
                        className="bg-blue-500 rounded-t w-full min-h-[4px] transition-all duration-300"
                        style={{ height: `${height}%` }}
                        title={`${hour}: ${votes} votes`}
                      ></div>
                      <span className="text-xs text-gray-600 mt-1 transform -rotate-45">
                        {i}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}